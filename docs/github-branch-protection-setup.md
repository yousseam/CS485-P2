# Task #7: GitHub Branch Protection Setup

This document provides step-by-step instructions for setting up branch protection rules on your GitHub repository to ensure code quality and prevent unauthorized merges to the main branch.

## Why Branch Protection Matters

Branch protection rules are critical for maintaining code quality and preventing accidental or malicious changes to your main branch. They ensure that:

1. Code must be reviewed before being merged
2. All tests must pass before merging
3. No direct commits to the main branch are allowed

## Step-by-Step Instructions

### 1. Navigate to Repository Settings

1. Go to your GitHub repository
2. Click on the **Settings** tab at the top of the repository page
3. On the left sidebar, click on **Branches**

### 2. Create Branch Protection Rule

1. In the Branches section, look for **Branch rules** section
2. Click on **Add branch rule** button
3. Enter the branch name: `main`
4. Click **Create branch rule** button

### 3. Configure Protection Rules

After creating the branch rule, you'll see a configuration screen. Enable the following settings:

#### Required Settings:

1. **Require a pull request before merging**
   - ✅ Check the box
   - **Require approvals**: Set to **1** (at least one person must review and approve)
   - **Dismiss stale PR approvals when new commits are pushed**: ✅ Check this
   - **Require review from CODEOWNERS**: Leave unchecked unless you have a CODEOWNERS file

2. **Require status checks to pass before merging**
   - ✅ Check the box
   - **Require branches to be up to date before merging**: ✅ Check this

3. **Select required status checks**
   - In the **Status checks found in the last week for this repository** section, select:
     - ✅ `Run frontend tests`
     - ✅ `Run Backend Tests`
     - ✅ `Run Integration Tests`

#### Recommended Additional Settings:

4. **Do not allow bypassing the above settings**
   - ✅ Check this to ensure even admins cannot bypass the rules

5. **Require signed commits**
   - Leave unchecked (optional for class projects)

6. **Include administrators**
   - ✅ Check this to apply rules to repository administrators as well

7. **Restrict who can push to matching branches**
   - Leave unchecked (allows any contributor with write access to create pull requests)

8. **Allow force pushes**
   - ❌ Leave unchecked (prevents force pushes to main)

9. **Allow deletions**
   - ❌ Leave unchecked (prevents accidental deletion of main branch)

### 4. Save Your Changes

1. Click the **Create** or **Update** button at the bottom of the page
2. Your branch protection rule is now active

## Verification

To verify that branch protection is working correctly:

1. Try to commit directly to main (this should fail)
   ```bash
   git checkout main
   echo "test" >> test.txt
   git add test.txt
   git commit -m "Test direct commit"
   git push origin main
   ```
   Expected: Push rejected by branch protection rule

2. Create a feature branch and make a change
   ```bash
   git checkout -b test-branch-protection
   echo "test" >> test.txt
   git add test.txt
   git commit -m "Test branch protection"
   git push origin test-branch-protection
   ```

3. Create a pull request via GitHub web interface
   - The PR should show that you need approval and status checks must pass
   - You should not be able to merge until tests pass and the PR is approved

## Troubleshooting

### "Required status checks not found"

If you don't see your workflows in the status checks list:

1. Run your workflows at least once on a pull request
2. Wait a few minutes for GitHub to index the workflow results
3. Refresh the branch protection page
4. The workflows should now appear in the list

### "Branch protection rule prevents push"

This is the expected behavior! Branch protection is working correctly when it prevents direct pushes to main. Always work on feature branches and create pull requests.

### Status checks not passing

If your status checks are failing:

1. Check the Actions tab to see what's failing
2. Review the workflow logs to identify the issue
3. Fix the failing tests in your feature branch
4. Push the fix - the status checks will automatically re-run

## Best Practices

1. **Always use feature branches**: Never work directly on main
2. **Keep PRs focused**: Small, focused pull requests are easier to review and debug
3. **Review requirements**: At least one team member must review and approve each PR
4. **Test before creating PR**: Run tests locally to catch issues early
5. **Use descriptive commit messages**: Clear commit messages help reviewers understand changes

## Team Considerations

### Review Process

- Set up a team review rotation so PRs don't wait too long for approval
- Use GitHub's review comments to provide feedback
- Don't merge your own PRs unless absolutely necessary

### Notification Settings

Configure GitHub notifications so you're notified when:
- Someone creates a PR that needs your review
- A PR you created is approved or needs changes
- CI tests fail on your PR

## Impact on Development Workflow

With branch protection enabled, your workflow becomes:

1. ✅ Create a feature branch
2. ✅ Make changes and commit to feature branch
3. ✅ Push feature branch to GitHub
4. ✅ Create a pull request
5. ✅ CI runs automatically
6. ✅ Wait for tests to pass
7. ✅ Request review from team member
8. ✅ Team member reviews and approves
9. ✅ Merge pull request to main (automatically or manually)
10. ✅ Deploy to AWS (if CD is configured)

This ensures quality control and maintains a stable main branch throughout development.

---

**Note**: These instructions assume you have admin or maintainer access to the repository. If you don't have these permissions, contact your team's repository administrator to set up branch protection rules.