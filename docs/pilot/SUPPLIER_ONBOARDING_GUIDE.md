# Supplier onboarding guide

1. Administrator confirms the legal organization and approved identity through
   the external IdP; never share accounts or passwords.
2. Assign the minimum supplier role and only the approved pilot projects. A
   supplier user must not receive an internal membership.
3. Supplier signs in through the identity-provider link and confirms their own
   organization name, assigned POs, ASNs, NCRs, and scorecard.
4. Run a negative check against an unassigned project. Foreign and nonexistent
   identifiers must both return the same safe not-found response.
5. Train the user to acknowledge only addressed POs, append commitment
   revisions (never overwrite history), create/submit/dispatch ASNs, associate
   approved documents, respond to issued NCRs, and use the support route.
6. Record training, access approval, isolation result, and activation in the
   pilot-user list stored in the controlled operational location.

Do not send credentials by email/chat or place them in Git. Suspend access and
raise a severity-1 incident for any view of another supplier’s data.
