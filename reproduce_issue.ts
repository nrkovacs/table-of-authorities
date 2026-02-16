
import { parseDocument } from './src/citation-parser/index';
import { ALL_PATTERNS } from './src/citation-parser/patterns';

const sampleText = `
IN THE SUPREME COURT OF THE UNITED STATES 

PETITIONER'S BRIEF 

INTRODUCTION 

This case presents the question of whether the constitutional protections of the Fourteenth Amendment apply to state action that discriminates on the basis of race in public education. As this Court held in Brown v. Board of Education, 347 U.S. 483 (1954), "separate educational facilities are inherently unequal." The principle announced in Brown has been reaffirmed countless times. See, e.g., Loving v. Virginia, 388 U.S. 1 (1967); Regents of Univ. of Cal. v. Bakke, 438 U.S. 265 (1978). 

STATEMENT OF FACTS 

The facts of this case are straightforward. Pursuant to 42 U.S.C. § 1983, Plaintiff brought suit alleging violations of her rights under U.S. Const. amend. XIV, § 1. The district court had jurisdiction under 28 U.S.C. § 1331. As required by Fed. R. Civ. P. 12(b)(6), Defendants moved to dismiss the complaint. 

ARGUMENT 

I. LEGAL STANDARD 

A motion to dismiss under Fed. R. Civ. P. 12(b)(6) requires the court to accept all factual allegations as true. Bell Atlantic Corp. v. Twombly, 550 U.S. 544 (2007). The Supreme Court has explained that a complaint must contain "enough facts to state a claim to relief that is plausible on its face." Id. at 570. This standard was further clarified in Ashcroft v. Iqbal, 556 U.S. 662 (2009). 

II. CONSTITUTIONAL PROTECTIONS 

The Fourteenth Amendment provides that no state shall "deny to any person within its jurisdiction the equal protection of the laws." U.S. Const. amend. XIV, § 1. This protection extends to fundamental rights. San Antonio Independent School District v. Rodriguez, 411 U.S. 1 (1973).  

The principles articulated in Brown, supra, at 495, have been consistently applied. See also Green v. County School Board, 391 U.S. 430 (1968); Swann v. Charlotte-Mecklenburg Board of Education, 402 U.S. 1 (1971). As Justice Warren wrote for the Court in Brown, the question is "Does segregation of children in public schools solely on the basis of race...deprive the children of the minority group of equal educational opportunities?" Brown, 347 U.S. at 493. The answer, of course, is yes. 

III. STATUTORY BASIS 

Congress enacted 42 U.S.C. § 1983 to provide a remedy for constitutional violations. Monell v. Department of Social Services, 436 U.S. 658 (1978). Section 1983 provides: 

"Every person who, under color of any statute, ordinance, regulation, custom, or usage, of any State or Territory or the District of Columbia, subjects, or causes to be subjected, any citizen of the United States or other person within the jurisdiction thereof to the deprivation of any rights, privileges, or immunities secured by the Constitution and laws, shall be liable to the party injured..." 

42 U.S.C. § 1983. See also Patsy v. Board of Regents of Florida, 457 U.S. 496 (1982). 

Federal courts have jurisdiction over civil rights actions. See 28 U.S.C. § 1331 (federal question jurisdiction); 28 U.S.C. § 1343 (civil rights jurisdiction). 

IV. PROCEDURAL REQUIREMENTS 

Under the Federal Rules of Civil Procedure, a complaint need only contain "a short and plain statement of the claim." Fed. R. Civ. P. 8(a)(2). The pleading standard is not heightened simply because the case involves complex legal issues. Twombly, supra, at 555. 

The Rules of Evidence also support Plaintiff's position. Fed. R. Evid. 702 governs expert testimony. The regulations at 28 C.F.R. § 35.130 further define prohibited discrimination. 

V. SECONDARY AUTHORITIES 

Leading scholars have long recognized the importance of Brown. Professor Laurence Tribe has written extensively on this subject. See Laurence H. Tribe, American Constitutional Law § 16-14 (3d ed. 2000). Similarly, the treatise Wright & Miller explains that civil rights claims require careful pleading. See 5 Charles Alan Wright & Arthur R. Miller, Federal Practice and Procedure § 1357 (3d ed. 2004). 

The Restatement (Second) of Torts § 402A also provides relevant guidance on liability standards.
`;

const pageMap = new Map<number, string>();
pageMap.set(1, sampleText);

const result = parseDocument(sampleText, pageMap);

console.log("Found citations:", result.citations.length);
result.citations.forEach(c => {
    console.log(`[${c.category}] Content: "${c.text}"`);
});
