I want to check whether my assigned P2 functions in the Fin Buddy project are working correctly.

My modules are Salary & Tax and Money Plan.

Please inspect the existing code and test the functions that are already implemented. Do not rebuild the project or overwrite any files.

Check these features individually:

**Salary & Tax**
1. In-hand salary calculator
2. Salary breakdown and deductions
3. Payslip audit
4. Tax regime comparison and sliders
5. Savings gap calculator
6. TDS and advance tax estimates

**Money Plan**
7. Financial health score
8. Savings goals and monthly savings calculation
9. Loan EMI and total interest calculation
10. Loan prepayment versus investment simulator
11. Regret simulator
12. Admin area, if implemented in the project specification

For each feature:
- Find the actual function or component in the code.
- Check whether it is implemented or only a placeholder.
- Run existing unit tests where available.
- Test normal inputs, zero values, missing inputs, invalid inputs, and boundary cases where relevant.
- Check that calculations produce sensible results.
- Identify frontend errors, backend/API errors, and integration problems.
- Do not invent missing functions or claim that something works without testing it.

Return a table with these columns:
Feature | File/function name | Status (PASS/FAIL/NOT IMPLEMENTED/NOT TESTED) | Test performed | Error or missing work.

Run the existing test and build commands if appropriate. If a command may modify data or files, explain that first.

Start with inspection and testing only. Do not make changes until I approve the fixes.