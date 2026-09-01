import assert from "node:assert/strict";
import test from "node:test";
import {
  GOVERNED_RELEASE_LABELS,
  canonicalJson,
  githubRemoteControlDigest,
  projectGitHubRemoteControlEvidence,
  validateGitHubRemoteControlProjection,
} from "./github-remote-control-evidence.mjs";

const repository = { id: 9876, full_name: "owner/repository" };
const candidate = { branch: "main", sourceSha: "a".repeat(40) };
const independentReviewers = new Map([
  ["INDEPENDENT-SECURITY", "security-reviewer"],
  ["INDEPENDENT-DATA-RELEASE", "release-reviewer"],
]);
const implementationOperator = "owner";

function projection(name, primary, projectionInputs = {}) {
  return projectGitHubRemoteControlEvidence({
    name,
    primary,
    projectionInputs,
    repository,
    candidate,
    independentReviewers,
    implementationOperator,
  });
}

function validControls() {
  return {
    branchProtection: {
      primary: {
        required_status_checks: {
          strict: true,
          checks: [
            { context: "verify", app_id: 1 },
            { context: "container-security", app_id: 1 },
          ],
          contexts: ["dependency-review"],
        },
        required_pull_request_reviews: {
          dismiss_stale_reviews: true,
          require_code_owner_reviews: false,
          require_last_push_approval: true,
          required_approving_review_count: 1,
        },
        enforce_admins: { enabled: true },
        required_conversation_resolution: { enabled: true },
        allow_force_pushes: { enabled: false },
        allow_deletions: { enabled: false },
      },
    },
    protectedEnvironment: {
      primary: {
        id: 123,
        name: "production",
        can_admins_bypass: false,
        deployment_branch_policy: {
          protected_branches: true,
          custom_branch_policies: false,
        },
        protection_rules: [
          { type: "branch_policy", id: 1 },
          {
            type: "required_reviewers",
            id: 2,
            prevent_self_review: true,
            reviewers: [
              {
                type: "User",
                reviewer: { login: "security-reviewer", id: 43 },
              },
              {
                type: "User",
                reviewer: { login: "release-reviewer", id: 44 },
              },
            ],
          },
        ],
      },
      projectionInputs: {
        environmentSecrets: {
          total_count: 1,
          secrets: [
            { name: "PHASE_ZERO_READ_TOKEN", updated_at: "2026-08-20" },
          ],
        },
      },
    },
    restrictedActions: {
      primary: {
        enabled: true,
        allowed_actions: "selected",
        sha_pinning_required: true,
      },
      projectionInputs: {
        selectedActions: {
          github_owned_allowed: false,
          verified_allowed: false,
          patterns_allowed: [
            "actions/checkout@*",
            "actions/dependency-review-action@*",
            "actions/setup-node@*",
            "actions/upload-artifact@*",
          ],
        },
        workflowPermissions: {
          default_workflow_permissions: "read",
          can_approve_pull_request_reviews: false,
        },
      },
    },
    independentReviewerAccess: {
      primary: [
        {
          login: "release-reviewer",
          id: 20,
          permissions: { pull: true, push: true, admin: false },
        },
        {
          login: "security-reviewer",
          id: 10,
          permissions: { pull: true, push: true, admin: false },
        },
      ],
    },
    releaseLabels: {
      primary: [
        ...Object.entries(GOVERNED_RELEASE_LABELS).map(
          ([name, description]) => ({ name, description, color: "000000" }),
        ),
        { name: "unrelated", description: "ignored" },
      ],
    },
    repositoryVisibility: {
      primary: {
        id: repository.id,
        full_name: repository.full_name,
        visibility: "public",
        archived: false,
        disabled: false,
      },
    },
  };
}

test("canonical JSON sorts object keys and rejects ambiguous values", () => {
  assert.equal(
    canonicalJson({ zebra: 1, alpha: { two: 2, one: 1 } }),
    '{"alpha":{"one":1,"two":2},"zebra":1}',
  );
  assert.throws(() => canonicalJson({ omitted: undefined }), /undefined/u);
  assert.throws(() => canonicalJson({ invalid: Number.NaN }), /non-finite/u);
  const cyclic = {};
  cyclic.self = cyclic;
  assert.throws(() => canonicalJson(cyclic), /cyclic/u);
});

test("all six canonical control projections satisfy the release policy", () => {
  for (const [name, input] of Object.entries(validControls())) {
    assert.deepEqual(
      validateGitHubRemoteControlProjection(
        name,
        projection(name, input.primary, input.projectionInputs),
      ),
      [],
      name,
    );
  }
});

test("branch protection rejects every weakened exact-gate setting", () => {
  const baseline = validControls().branchProtection.primary;
  const mutations = [
    (value) => {
      value.required_status_checks.strict = false;
    },
    (value) => {
      value.required_status_checks.contexts.push("unexpected-check");
    },
    (value) => {
      value.required_pull_request_reviews.require_last_push_approval = false;
    },
    (value) => {
      value.required_conversation_resolution.enabled = false;
    },
    (value) => {
      value.required_pull_request_reviews.dismiss_stale_reviews = false;
    },
    (value) => {
      value.enforce_admins.enabled = false;
    },
  ];
  for (const mutate of mutations) {
    const changed = structuredClone(baseline);
    mutate(changed);
    assert.match(
      validateGitHubRemoteControlProjection(
        "branchProtection",
        projection("branchProtection", changed),
      ).join("\n"),
      /required release gate/u,
    );
  }
});

test("environment rejects missing reviewers, self review, bypass, branch drift, and token drift", () => {
  const baseline = validControls().protectedEnvironment;
  const mutations = [
    (value) => {
      value.primary.protection_rules[1].reviewers.pop();
    },
    (value) => {
      value.primary.protection_rules[1].prevent_self_review = false;
    },
    (value) => {
      value.primary.can_admins_bypass = true;
    },
    (value) => {
      value.primary.deployment_branch_policy.protected_branches = false;
    },
    (value) => {
      value.primary.deployment_branch_policy.custom_branch_policies = true;
    },
    (value) => {
      value.projectionInputs.environmentSecrets.secrets = [];
    },
  ];
  for (const mutate of mutations) {
    const changed = structuredClone(baseline);
    mutate(changed);
    assert.match(
      validateGitHubRemoteControlProjection(
        "protectedEnvironment",
        projection(
          "protectedEnvironment",
          changed.primary,
          changed.projectionInputs,
        ),
      ).join("\n"),
      /production environment/u,
    );
  }
});

test("Actions rejects broad selection, allowlist drift, and unsafe workflow defaults", () => {
  const baseline = validControls().restrictedActions;
  const mutations = [
    (value) => {
      value.primary.allowed_actions = "all";
    },
    (value) => {
      value.primary.sha_pinning_required = false;
    },
    (value) => {
      value.projectionInputs.selectedActions.github_owned_allowed = true;
    },
    (value) => {
      value.projectionInputs.selectedActions.verified_allowed = true;
    },
    (value) => {
      value.projectionInputs.selectedActions.patterns_allowed.pop();
    },
    (value) => {
      value.projectionInputs.selectedActions.patterns_allowed.push(
        "untrusted/action@*",
      );
    },
    (value) => {
      value.projectionInputs.workflowPermissions.default_workflow_permissions =
        "write";
    },
    (value) => {
      value.projectionInputs.workflowPermissions.can_approve_pull_request_reviews = true;
    },
  ];
  for (const mutate of mutations) {
    const changed = structuredClone(baseline);
    mutate(changed);
    assert.match(
      validateGitHubRemoteControlProjection(
        "restrictedActions",
        projection(
          "restrictedActions",
          changed.primary,
          changed.projectionInputs,
        ),
      ).join("\n"),
      /not release-safe/u,
    );
  }
});

test("reviewer access requires two exact non-operator writers without admin", () => {
  const baseline = validControls().independentReviewerAccess.primary;
  for (const mutate of [
    (value) => {
      value[0].permissions.push = false;
    },
    (value) => {
      value[0].permissions.admin = true;
    },
    (value) => {
      value[0].login = value[1].login;
    },
  ]) {
    const changed = structuredClone(baseline);
    mutate(changed);
    assert.match(
      validateGitHubRemoteControlProjection(
        "independentReviewerAccess",
        projection("independentReviewerAccess", changed),
      ).join("\n"),
      /both roster roles/u,
    );
  }

  const operatorRoster = new Map([
    ["INDEPENDENT-SECURITY", implementationOperator],
    ["INDEPENDENT-DATA-RELEASE", "release-reviewer"],
  ]);
  const operatorCollaborators = [
    {
      login: implementationOperator,
      permissions: { pull: true, push: true, admin: false },
    },
    {
      login: "release-reviewer",
      permissions: { pull: true, push: true, admin: false },
    },
  ];
  const operatorProjection = projectGitHubRemoteControlEvidence({
    name: "independentReviewerAccess",
    primary: operatorCollaborators,
    repository,
    candidate,
    independentReviewers: operatorRoster,
    implementationOperator,
  });
  assert.match(
    validateGitHubRemoteControlProjection(
      "independentReviewerAccess",
      operatorProjection,
    ).join("\n"),
    /both roster roles/u,
  );
});

test("visibility requires a live public, active, enabled repository", () => {
  const baseline = validControls().repositoryVisibility.primary;
  for (const mutate of [
    (value) => {
      value.visibility = "private";
    },
    (value) => {
      value.archived = true;
    },
    (value) => {
      value.disabled = true;
    },
  ]) {
    const changed = structuredClone(baseline);
    mutate(changed);
    assert.match(
      validateGitHubRemoteControlProjection(
        "repositoryVisibility",
        projection("repositoryVisibility", changed),
      ).join("\n"),
      /visibility evidence/u,
    );
  }
});

test("visibility digest ignores volatile repository fields but binds visibility", () => {
  const input = validControls().repositoryVisibility.primary;
  const first = githubRemoteControlDigest({
    name: "repositoryVisibility",
    primary: { ...input, updated_at: "one", open_issues_count: 10 },
    repository,
    candidate,
    independentReviewers,
  });
  const second = githubRemoteControlDigest({
    name: "repositoryVisibility",
    primary: { ...input, updated_at: "two", open_issues_count: 999 },
    repository,
    candidate,
    independentReviewers,
  });
  const changed = githubRemoteControlDigest({
    name: "repositoryVisibility",
    primary: { ...input, visibility: "private" },
    repository,
    candidate,
    independentReviewers,
  });
  assert.equal(first, second);
  assert.notEqual(first, changed);
});

test("branch projection normalizes check order and ignores response metadata", () => {
  const input = validControls().branchProtection.primary;
  const first = githubRemoteControlDigest({
    name: "branchProtection",
    primary: input,
    repository,
    candidate,
    independentReviewers,
  });
  const second = githubRemoteControlDigest({
    name: "branchProtection",
    primary: {
      ...input,
      url: "https://api.github.com/volatile",
      required_status_checks: {
        ...input.required_status_checks,
        contexts: [...input.required_status_checks.contexts].reverse(),
        checks: [...input.required_status_checks.checks].reverse(),
      },
    },
    repository,
    candidate,
    independentReviewers,
  });
  assert.equal(first, second);

  const changedApp = structuredClone(input);
  changedApp.required_status_checks.checks[0].app_id = 999;
  assert.notEqual(
    first,
    githubRemoteControlDigest({
      name: "branchProtection",
      primary: changedApp,
      repository,
      candidate,
      independentReviewers,
    }),
  );

  const unsafe = structuredClone(input);
  unsafe.allow_force_pushes.enabled = true;
  assert.match(
    validateGitHubRemoteControlProjection(
      "branchProtection",
      projection("branchProtection", unsafe),
    ).join("\n"),
    /release gate/u,
  );
});

test("environment projection sorts identities and secrets while enforcing its token", () => {
  const input = validControls().protectedEnvironment;
  const first = githubRemoteControlDigest({
    name: "protectedEnvironment",
    primary: input.primary,
    projectionInputs: input.projectionInputs,
    repository,
    candidate,
    independentReviewers,
  });
  const second = githubRemoteControlDigest({
    name: "protectedEnvironment",
    primary: {
      ...input.primary,
      updated_at: "ignored",
      protection_rules: [...input.primary.protection_rules].reverse(),
    },
    projectionInputs: {
      environmentSecrets: {
        total_count: 2,
        secrets: [
          { name: "ANOTHER_SECRET", created_at: "ignored" },
          { name: "PHASE_ZERO_READ_TOKEN", updated_at: "changed" },
        ],
      },
    },
    repository,
    candidate,
    independentReviewers,
  });
  assert.notEqual(
    first,
    second,
    "a changed secret-name set must change the digest",
  );

  const missingSecret = projection("protectedEnvironment", input.primary, {
    environmentSecrets: { total_count: 0, secrets: [] },
  });
  assert.match(
    validateGitHubRemoteControlProjection(
      "protectedEnvironment",
      missingSecret,
    ).join("\n"),
    /read token/u,
  );
});

test("Actions projection binds selected configuration and workflow defaults", () => {
  const input = validControls().restrictedActions;
  const first = githubRemoteControlDigest({
    name: "restrictedActions",
    primary: input.primary,
    projectionInputs: input.projectionInputs,
    repository,
    candidate,
    independentReviewers,
  });
  const reordered = structuredClone(input.projectionInputs);
  reordered.selectedActions.patterns_allowed.reverse();
  assert.equal(
    first,
    githubRemoteControlDigest({
      name: "restrictedActions",
      primary: { ...input.primary, ignored: "metadata" },
      projectionInputs: reordered,
      repository,
      candidate,
      independentReviewers,
    }),
  );

  const unsafe = structuredClone(input.projectionInputs);
  unsafe.workflowPermissions.can_approve_pull_request_reviews = true;
  const unsafeProjection = projection(
    "restrictedActions",
    input.primary,
    unsafe,
  );
  assert.notEqual(
    first,
    githubRemoteControlDigest({
      name: "restrictedActions",
      primary: input.primary,
      projectionInputs: unsafe,
      repository,
      candidate,
      independentReviewers,
    }),
  );
  assert.match(
    validateGitHubRemoteControlProjection(
      "restrictedActions",
      unsafeProjection,
    ).join("\n"),
    /not release-safe/u,
  );
});

test("reviewer and label projections ignore unrelated metadata but bind security fields", () => {
  const controls = validControls();
  const reviewers = controls.independentReviewerAccess.primary;
  const reviewerDigest = githubRemoteControlDigest({
    name: "independentReviewerAccess",
    primary: reviewers,
    repository,
    candidate,
    independentReviewers,
  });
  assert.equal(
    reviewerDigest,
    githubRemoteControlDigest({
      name: "independentReviewerAccess",
      primary: reviewers
        .map((reviewer) => ({ ...reviewer, avatar_url: "changed" }))
        .reverse(),
      repository,
      candidate,
      independentReviewers,
    }),
  );
  const adminReviewer = structuredClone(reviewers);
  adminReviewer[0].permissions.admin = true;
  assert.match(
    validateGitHubRemoteControlProjection(
      "independentReviewerAccess",
      projection("independentReviewerAccess", adminReviewer),
    ).join("\n"),
    /both roster roles/u,
  );

  const labels = controls.releaseLabels.primary;
  const labelDigest = githubRemoteControlDigest({
    name: "releaseLabels",
    primary: labels,
    repository,
    candidate,
    independentReviewers,
  });
  assert.equal(
    labelDigest,
    githubRemoteControlDigest({
      name: "releaseLabels",
      primary: labels
        .map((label) => ({ ...label, id: 123, color: "ffffff" }))
        .reverse(),
      repository,
      candidate,
      independentReviewers,
    }),
  );
  const wrongDescription = structuredClone(labels);
  wrongDescription.find((label) => label.name === "BLOCKER").description =
    "almost right";
  assert.match(
    validateGitHubRemoteControlProjection(
      "releaseLabels",
      projection("releaseLabels", wrongDescription),
    ).join("\n"),
    /not exact/u,
  );
});
