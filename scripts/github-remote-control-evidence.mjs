import { createHash } from "node:crypto";

export const GITHUB_REMOTE_CONTROL_PROJECTION_SCHEMA =
  "mecoflow/github-control/v1";

export const REQUIRED_BRANCH_CHECKS = Object.freeze([
  "container-security",
  "dependency-review",
  "verify",
]);

export const REQUIRED_ACTION_PATTERNS = Object.freeze([
  "actions/checkout@*",
  "actions/dependency-review-action@*",
  "actions/setup-node@*",
  "actions/upload-artifact@*",
]);

export const GOVERNED_RELEASE_LABELS = Object.freeze({
  BLOCKER: "Release-blocking issue requiring closure evidence",
  CRITICAL: "Critical severity requiring immediate owner action",
  HIGH: "High-severity readiness or security finding",
  "IMPLEMENTED-UNCOMMITTED":
    "Implemented locally but lacking an approved committed baseline",
  "LATER-PHASE": "Explicitly assigned to a later implementation phase",
});

const REMOTE_CONTROL_NAMES = new Set([
  "branchProtection",
  "protectedEnvironment",
  "restrictedActions",
  "independentReviewerAccess",
  "releaseLabels",
  "repositoryVisibility",
]);

function compareStrings(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function booleanOrNull(value) {
  return typeof value === "boolean" ? value : null;
}

function numberOrNull(value) {
  return Number.isInteger(value) ? value : null;
}

function stringOrNull(value) {
  return typeof value === "string" ? value : null;
}

function normalizedLogin(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function sortedUniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === "string"))].sort(
    compareStrings,
  );
}

function sortedUniqueStringsOrNull(values) {
  return Array.isArray(values) &&
    values.every((value) => typeof value === "string" && value.length > 0)
    ? sortedUniqueStrings(values)
    : null;
}

function canonicalValue(value, ancestors = new Set()) {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError("canonical JSON does not accept non-finite numbers");
    }
    return Object.is(value, -0) ? 0 : value;
  }
  if (typeof value !== "object") {
    throw new TypeError(`canonical JSON does not accept ${typeof value}`);
  }
  if (ancestors.has(value)) {
    throw new TypeError("canonical JSON does not accept cyclic values");
  }
  ancestors.add(value);
  let normalized;
  if (Array.isArray(value)) {
    normalized = value.map((entry) => canonicalValue(entry, ancestors));
  } else {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError(
        "canonical JSON accepts only plain objects and arrays",
      );
    }
    normalized = {};
    for (const key of Object.keys(value).sort(compareStrings)) {
      if (value[key] === undefined) {
        throw new TypeError("canonical JSON does not accept undefined values");
      }
      normalized[key] = canonicalValue(value[key], ancestors);
    }
  }
  ancestors.delete(value);
  return normalized;
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalValue(value));
}

export function canonicalSha256(value) {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

function subject(
  repository,
  candidate,
  independentReviewers,
  implementationOperator,
) {
  return {
    candidateBranch: stringOrNull(candidate?.branch),
    candidateSourceSha: stringOrNull(candidate?.sourceSha),
    implementationOperator: normalizedLogin(implementationOperator) || null,
    independentReviewers: [...independentReviewers.entries()]
      .map(([roleId, reviewerLogin]) => ({
        identity: normalizedLogin(reviewerLogin) || null,
        roleId: stringOrNull(roleId),
      }))
      .sort((left, right) =>
        compareStrings(left.roleId ?? "", right.roleId ?? ""),
      ),
    repositoryFullName: stringOrNull(repository?.full_name),
    repositoryId: numberOrNull(repository?.id),
  };
}

function branchProtectionConfiguration(primary) {
  const rawContexts = primary?.required_status_checks?.contexts;
  const rawChecks = primary?.required_status_checks?.checks;
  const contexts = Array.isArray(rawContexts)
    ? sortedUniqueStringsOrNull(rawContexts)
    : rawContexts === undefined
      ? []
      : null;
  const checks = Array.isArray(rawChecks)
    ? rawChecks
        .map((check) => ({
          appId: numberOrNull(check?.app_id),
          context: stringOrNull(check?.context),
        }))
        .sort((left, right) =>
          compareStrings(canonicalJson(left), canonicalJson(right)),
        )
    : rawChecks === undefined
      ? []
      : null;
  return {
    allowDeletions: booleanOrNull(primary?.allow_deletions?.enabled),
    allowForkSyncing: booleanOrNull(primary?.allow_fork_syncing?.enabled),
    allowForcePushes: booleanOrNull(primary?.allow_force_pushes?.enabled),
    enforceAdmins: booleanOrNull(primary?.enforce_admins?.enabled),
    lockBranch: booleanOrNull(primary?.lock_branch?.enabled),
    requiredConversationResolution: booleanOrNull(
      primary?.required_conversation_resolution?.enabled,
    ),
    requiredLinearHistory: booleanOrNull(
      primary?.required_linear_history?.enabled,
    ),
    requiredPullRequestReviews: {
      dismissStaleReviews: booleanOrNull(
        primary?.required_pull_request_reviews?.dismiss_stale_reviews,
      ),
      requireCodeOwnerReviews: booleanOrNull(
        primary?.required_pull_request_reviews?.require_code_owner_reviews,
      ),
      requireLastPushApproval: booleanOrNull(
        primary?.required_pull_request_reviews?.require_last_push_approval,
      ),
      requiredApprovingReviewCount: numberOrNull(
        primary?.required_pull_request_reviews?.required_approving_review_count,
      ),
    },
    requiredSignatures: booleanOrNull(primary?.required_signatures?.enabled),
    requiredStatusChecks: {
      checks,
      contexts,
      strict: booleanOrNull(primary?.required_status_checks?.strict),
    },
  };
}

function environmentReviewer(reviewer) {
  const type = stringOrNull(reviewer?.type);
  const identity =
    type === "User"
      ? normalizedLogin(reviewer?.reviewer?.login) || null
      : type === "Team"
        ? normalizedLogin(
            reviewer?.reviewer?.slug ?? reviewer?.reviewer?.name,
          ) || null
        : null;
  return { identity, type };
}

function protectedEnvironmentConfiguration(primary, projectionInputs) {
  const rules = Array.isArray(primary?.protection_rules)
    ? primary.protection_rules
        .filter((rule) => rule?.type === "required_reviewers")
        .map((rule) => ({
          preventSelfReview: booleanOrNull(rule?.prevent_self_review),
          reviewers: (Array.isArray(rule?.reviewers) ? rule.reviewers : [])
            .map(environmentReviewer)
            .sort((left, right) =>
              compareStrings(
                `${left.type}:${left.identity}`,
                `${right.type}:${right.identity}`,
              ),
            ),
        }))
        .sort((left, right) =>
          compareStrings(canonicalJson(left), canonicalJson(right)),
        )
    : null;
  const environmentSecrets = projectionInputs?.environmentSecrets;
  const secretNames =
    Array.isArray(environmentSecrets?.secrets) &&
    Number.isInteger(environmentSecrets?.total_count) &&
    environmentSecrets.total_count === environmentSecrets.secrets.length
      ? sortedUniqueStringsOrNull(
          environmentSecrets.secrets.map((secret) => secret?.name),
        )
      : null;
  return {
    canAdminsBypass: booleanOrNull(primary?.can_admins_bypass),
    deploymentBranchPolicy: {
      customBranchPolicies: booleanOrNull(
        primary?.deployment_branch_policy?.custom_branch_policies,
      ),
      protectedBranches: booleanOrNull(
        primary?.deployment_branch_policy?.protected_branches,
      ),
    },
    name: stringOrNull(primary?.name),
    requiredReviewerRules: rules,
    secretNames,
  };
}

function restrictedActionsConfiguration(primary, projectionInputs) {
  const selected = projectionInputs?.selectedActions;
  const workflow = projectionInputs?.workflowPermissions;
  return {
    allowedActions: stringOrNull(primary?.allowed_actions),
    enabled: booleanOrNull(primary?.enabled),
    selectedActions:
      selected && typeof selected === "object"
        ? {
            githubOwnedAllowed: booleanOrNull(selected.github_owned_allowed),
            patternsAllowed: Array.isArray(selected.patterns_allowed)
              ? sortedUniqueStringsOrNull(selected.patterns_allowed)
              : null,
            verifiedAllowed: booleanOrNull(selected.verified_allowed),
          }
        : null,
    shaPinningRequired: booleanOrNull(primary?.sha_pinning_required),
    workflowDefaults:
      workflow && typeof workflow === "object"
        ? {
            canApprovePullRequestReviews: booleanOrNull(
              workflow.can_approve_pull_request_reviews,
            ),
            defaultWorkflowPermissions: stringOrNull(
              workflow.default_workflow_permissions,
            ),
          }
        : null,
  };
}

function reviewerAccessConfiguration(primary, independentReviewers) {
  const collaborators = new Map(
    (Array.isArray(primary) ? primary : []).map((entry) => [
      normalizedLogin(entry?.login),
      entry,
    ]),
  );
  return {
    reviewers: [...independentReviewers.entries()]
      .map(([roleId, reviewerLogin]) => {
        const identity = normalizedLogin(reviewerLogin);
        const collaborator = collaborators.get(identity);
        return {
          identity,
          permissions: collaborator
            ? {
                admin: booleanOrNull(collaborator.permissions?.admin),
                maintain: booleanOrNull(collaborator.permissions?.maintain),
                pull: booleanOrNull(collaborator.permissions?.pull),
                push: booleanOrNull(collaborator.permissions?.push),
                triage: booleanOrNull(collaborator.permissions?.triage),
              }
            : null,
          roleId,
        };
      })
      .sort((left, right) => compareStrings(left.roleId, right.roleId)),
  };
}

function releaseLabelConfiguration(primary) {
  const labels = new Map(
    (Array.isArray(primary) ? primary : []).map((entry) => [
      entry?.name,
      entry,
    ]),
  );
  return {
    labels: Object.keys(GOVERNED_RELEASE_LABELS)
      .sort(compareStrings)
      .map((name) => ({
        description: stringOrNull(labels.get(name)?.description),
        name,
      })),
  };
}

function repositoryVisibilityConfiguration(primary) {
  return {
    archived: booleanOrNull(primary?.archived),
    disabled: booleanOrNull(primary?.disabled),
    fullName: stringOrNull(primary?.full_name),
    repositoryId: numberOrNull(primary?.id),
    visibility: stringOrNull(primary?.visibility),
  };
}

export function projectGitHubRemoteControlEvidence({
  name,
  primary,
  projectionInputs = {},
  repository,
  candidate,
  independentReviewers = new Map(),
  implementationOperator,
}) {
  if (!REMOTE_CONTROL_NAMES.has(name)) {
    throw new TypeError(`unsupported GitHub remote control: ${name}`);
  }
  let configuration;
  if (name === "branchProtection") {
    configuration = branchProtectionConfiguration(primary);
  } else if (name === "protectedEnvironment") {
    configuration = protectedEnvironmentConfiguration(
      primary,
      projectionInputs,
    );
  } else if (name === "restrictedActions") {
    configuration = restrictedActionsConfiguration(primary, projectionInputs);
  } else if (name === "independentReviewerAccess") {
    configuration = reviewerAccessConfiguration(primary, independentReviewers);
  } else if (name === "releaseLabels") {
    configuration = releaseLabelConfiguration(primary);
  } else {
    configuration = repositoryVisibilityConfiguration(primary);
  }
  return {
    configuration,
    control: name,
    projectionSchema: GITHUB_REMOTE_CONTROL_PROJECTION_SCHEMA,
    subject: subject(
      repository,
      candidate,
      independentReviewers,
      implementationOperator,
    ),
  };
}

export function githubRemoteControlDigest(input) {
  return canonicalSha256(projectGitHubRemoteControlEvidence(input));
}

export function githubRemoteControlAuxiliaryApiPaths(name, repository) {
  if (name === "protectedEnvironment") {
    return {
      environmentSecrets: `repos/${repository}/environments/production/secrets?per_page=100`,
    };
  }
  if (name === "restrictedActions") {
    return {
      selectedActions: `repos/${repository}/actions/permissions/selected-actions`,
      workflowPermissions: `repos/${repository}/actions/permissions/workflow`,
    };
  }
  return {};
}

function exactGovernedLabels(labels) {
  return (
    Array.isArray(labels) &&
    labels.length === Object.keys(GOVERNED_RELEASE_LABELS).length &&
    labels.every(
      (label) =>
        Object.hasOwn(GOVERNED_RELEASE_LABELS, label?.name) &&
        label.description === GOVERNED_RELEASE_LABELS[label.name],
    )
  );
}

export function validateGitHubRemoteControlProjection(name, projection) {
  const errors = [];
  if (
    projection?.projectionSchema !== GITHUB_REMOTE_CONTROL_PROJECTION_SCHEMA ||
    projection?.control !== name ||
    !Number.isInteger(projection?.subject?.repositoryId) ||
    !projection?.subject?.repositoryFullName ||
    !projection?.subject?.candidateBranch ||
    !projection?.subject?.implementationOperator ||
    !/^[0-9a-f]{40}$/u.test(projection?.subject?.candidateSourceSha ?? "")
  ) {
    return ["projection subject or schema is invalid"];
  }
  const configuration = projection.configuration;
  if (name === "branchProtection") {
    const checks = new Set([
      ...(configuration?.requiredStatusChecks?.contexts ?? []),
      ...(configuration?.requiredStatusChecks?.checks ?? []).map(
        (check) => check?.context,
      ),
    ]);
    if (
      checks.size !== REQUIRED_BRANCH_CHECKS.length ||
      !REQUIRED_BRANCH_CHECKS.every((check) => checks.has(check)) ||
      !Array.isArray(configuration?.requiredStatusChecks?.contexts) ||
      !Array.isArray(configuration?.requiredStatusChecks?.checks) ||
      configuration.requiredStatusChecks.checks.some(
        (check) =>
          !check?.context || !Number.isInteger(check.appId) || check.appId <= 0,
      ) ||
      configuration?.requiredStatusChecks?.strict !== true ||
      configuration?.requiredPullRequestReviews?.requiredApprovingReviewCount <
        1 ||
      configuration?.requiredPullRequestReviews?.dismissStaleReviews !== true ||
      configuration?.requiredPullRequestReviews?.requireLastPushApproval !==
        true ||
      configuration?.enforceAdmins !== true ||
      configuration?.requiredConversationResolution !== true ||
      configuration?.allowForcePushes !== false ||
      configuration?.allowDeletions !== false
    ) {
      errors.push(
        "branch protection does not preserve the required release gate",
      );
    }
  } else if (name === "protectedEnvironment") {
    const roster = new Set(
      (projection?.subject?.independentReviewers ?? []).map((entry) =>
        normalizedLogin(entry?.identity),
      ),
    );
    const reviewerRules = configuration?.requiredReviewerRules;
    const protectedReviewerIdentities = new Set(
      (Array.isArray(reviewerRules) ? reviewerRules : [])
        .filter((rule) => rule?.preventSelfReview === true)
        .flatMap((rule) => rule.reviewers ?? [])
        .filter((reviewer) => reviewer?.type === "User")
        .map((reviewer) => normalizedLogin(reviewer?.identity)),
    );
    if (
      configuration?.name !== "production" ||
      configuration?.canAdminsBypass !== false ||
      configuration?.deploymentBranchPolicy?.protectedBranches !== true ||
      configuration?.deploymentBranchPolicy?.customBranchPolicies !== false ||
      roster.size !== 2 ||
      [...roster].some(
        (reviewerIdentity) =>
          !reviewerIdentity ||
          !protectedReviewerIdentities.has(reviewerIdentity),
      ) ||
      !configuration?.secretNames?.includes("PHASE_ZERO_READ_TOKEN")
    ) {
      errors.push(
        "production environment is missing non-bypassable roster review or its read token",
      );
    }
  } else if (name === "restrictedActions") {
    const selected = configuration?.selectedActions;
    if (
      configuration?.enabled !== true ||
      configuration?.allowedActions !== "selected" ||
      configuration?.shaPinningRequired !== true ||
      !selected ||
      typeof selected.githubOwnedAllowed !== "boolean" ||
      typeof selected.verifiedAllowed !== "boolean" ||
      !Array.isArray(selected.patternsAllowed) ||
      selected.githubOwnedAllowed !== false ||
      selected.verifiedAllowed !== false ||
      canonicalJson(selected.patternsAllowed) !==
        canonicalJson(REQUIRED_ACTION_PATTERNS) ||
      configuration?.workflowDefaults?.defaultWorkflowPermissions !== "read" ||
      configuration?.workflowDefaults?.canApprovePullRequestReviews !== false
    ) {
      errors.push(
        "Actions restriction or workflow defaults are not release-safe",
      );
    }
  } else if (name === "independentReviewerAccess") {
    const roster = new Set(
      (projection?.subject?.independentReviewers ?? []).map((reviewer) =>
        normalizedLogin(reviewer?.identity),
      ),
    );
    const reviewerIdentities = new Set(
      (configuration?.reviewers ?? []).map((reviewer) =>
        normalizedLogin(reviewer?.identity),
      ),
    );
    if (
      !Array.isArray(configuration?.reviewers) ||
      configuration.reviewers.length !== 2 ||
      roster.size !== 2 ||
      reviewerIdentities.size !== 2 ||
      [...roster].some(
        (reviewerIdentity) => !reviewerIdentities.has(reviewerIdentity),
      ) ||
      reviewerIdentities.has(projection.subject.implementationOperator) ||
      configuration.reviewers.some(
        (reviewer) =>
          reviewer?.permissions?.pull !== true ||
          reviewer?.permissions?.push !== true ||
          reviewer?.permissions?.admin !== false,
      )
    ) {
      errors.push(
        "independent reviewer access is not bound to both roster roles",
      );
    }
  } else if (name === "releaseLabels") {
    if (!exactGovernedLabels(configuration?.labels)) {
      errors.push(
        "governed release label names and descriptions are not exact",
      );
    }
  } else if (name === "repositoryVisibility") {
    if (
      configuration?.repositoryId !== projection.subject.repositoryId ||
      configuration?.fullName !== projection.subject.repositoryFullName ||
      configuration?.visibility !== "public" ||
      configuration?.archived !== false ||
      configuration?.disabled !== false
    ) {
      errors.push(
        "repository visibility evidence is not bound to the repository",
      );
    }
  } else {
    errors.push("unsupported GitHub remote control projection");
  }
  return errors;
}
