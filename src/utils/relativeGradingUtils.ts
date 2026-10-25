import { SavedSubmission, SectionId } from '../types';

export type RelativeGrade = 'A' | 'B' | 'C';

export interface RelativeGradeCutoffs {
  gradeACutoff: number; // >= 80% (8 marks out of 10, or 40 out of 50)
  gradeBCutoff: number; // 50% - 79% (5 marks out of 10, or 25 out of 50)
  gradeCCutoff: number; // < 50% (0 to 4 marks out of 10, or 0 to 24 out of 50)
  isSmallSample: boolean;
  totalCollegeStudents: number;
  totalDeptStudents: number;
}

export interface RelativeDomainGradeResult {
  grade: RelativeGrade;
  collegePercentile: number;
  deptPercentile: number;
  gradeLabel: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  displayLabel: string;
  cutoffs: RelativeGradeCutoffs;
}

export interface RelativeOverallGradeResult {
  grade: RelativeGrade;
  collegePercentile: number;
  deptPercentile: number;
  gradeLabel: string;
  title: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  description: string;
  cutoffs: {
    gradeACutoff: number;
    gradeBCutoff: number;
    isSmallSample: boolean;
    totalCollegeStudents: number;
  };
}

/**
 * Format a number as an ordinal (e.g. 1st, 2nd, 3rd, 68th, 91st)
 */
export function formatPercentileOrdinal(pct: number): string {
  const rounded = Math.round(pct);
  const s = ['th', 'st', 'nd', 'rd'];
  const v = rounded % 100;
  return rounded + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Extracts raw score for a given domain from a submission
 */
export function getDomainScoreFromSub(sub: SavedSubmission, domainId: SectionId): number {
  if (sub.report?.sectionScores && sub.report.sectionScores[domainId]?.score !== undefined) {
    return sub.report.sectionScores[domainId].score;
  }
  if (sub.report?.detailedItemAnalysis) {
    return sub.report.detailedItemAnalysis.filter(
      (item) => item.sectionId === domainId && item.isCorrect
    ).length;
  }
  return 0;
}

/**
 * Computes fractional / average rank percentile for tied scores (used for supplementary normative statistics).
 */
export function computePercentileRank(score: number, allScores: number[]): number {
  if (!allScores || allScores.length === 0) return 0;
  const n = allScores.length;
  if (n === 1) return 100;

  const countLess = allScores.filter((s) => s < score).length;
  const countEqual = allScores.filter((s) => s === score).length;

  const avgRank = countLess + (countEqual + 1) / 2;
  const percentile = (avgRank / n) * 100;
  return Math.min(100, Math.max(0, Number(percentile.toFixed(1))));
}

/**
 * Computes absolute score cutoffs for a 10-mark domain:
 * Grade A: >= 80% (8 to 10 marks)
 * Grade B: 50% - 79% (5 to 7 marks)
 * Grade C: < 50% (0 to 4 marks)
 */
export function computeDomainCutoffs(
  allCollegeScores: number[],
  deptScores: number[] = [],
  maxMarks: number = 10
): RelativeGradeCutoffs {
  const totalCollegeStudents = allCollegeScores.length;
  const totalDeptStudents = deptScores.length;
  const gradeACutoff = Math.ceil(maxMarks * 0.8); // 8 for 10 marks
  const gradeBCutoff = Math.ceil(maxMarks * 0.5); // 5 for 10 marks

  return {
    gradeACutoff,
    gradeBCutoff,
    gradeCCutoff: 0,
    isSmallSample: false,
    totalCollegeStudents,
    totalDeptStudents
  };
}

/**
 * Calculates absolute (criterion-referenced) grade for a student in a specific domain (out of 10 marks).
 *
 * Rules:
 * - Grade A: >= 80% (8 - 10 marks)
 * - Grade B: 50% - 79% (5 - 7 marks)
 * - Grade C: < 50% (0 - 4 marks)
 */
export function calculateRelativeDomainGrade(
  studentScore: number,
  domainId: SectionId,
  allSubmissions: SavedSubmission[] = [],
  studentDept: string = 'General',
  maxMarks: number = 10
): RelativeDomainGradeResult {
  let collegeScores = allSubmissions.map((s) => getDomainScoreFromSub(s, domainId));
  if (collegeScores.length === 0) {
    collegeScores = [studentScore];
  }

  const deptTrimmed = (studentDept || 'General').trim().toLowerCase();
  let deptScores = allSubmissions
    .filter((s) => (s.student?.department || 'General').trim().toLowerCase() === deptTrimmed)
    .map((s) => getDomainScoreFromSub(s, domainId));

  if (deptScores.length === 0) {
    deptScores = [studentScore];
  }

  const collegePercentile = computePercentileRank(studentScore, collegeScores);
  const deptPercentile = computePercentileRank(studentScore, deptScores);
  const percentage = maxMarks > 0 ? (studentScore / maxMarks) * 100 : 0;

  let grade: RelativeGrade = 'C';
  let gradeLabel = 'Grade C (<50% / 0–4 Marks)';
  let color = '#EA580C';
  let badgeBg = 'bg-rose-100';
  let badgeBorder = 'border-rose-300';
  let badgeText = 'text-rose-800';

  if (percentage >= 80) {
    grade = 'A';
    gradeLabel = 'Grade A (≥80% / 8–10 Marks)';
    color = '#10B981';
    badgeBg = 'bg-emerald-100';
    badgeBorder = 'border-emerald-300';
    badgeText = 'text-emerald-800';
  } else if (percentage >= 50) {
    grade = 'B';
    gradeLabel = 'Grade B (50%–79% / 5–7 Marks)';
    color = '#3B82F6';
    badgeBg = 'bg-blue-100';
    badgeBorder = 'border-blue-300';
    badgeText = 'text-blue-800';
  }

  const cutoffs = computeDomainCutoffs(collegeScores, deptScores, maxMarks);

  const displayLabel = `Grade: ${grade} (${Math.round(percentage)}%) | College percentile: ${formatPercentileOrdinal(collegePercentile)} | Department percentile: ${formatPercentileOrdinal(deptPercentile)}`;

  return {
    grade,
    collegePercentile: Math.round(collegePercentile),
    deptPercentile: Math.round(deptPercentile),
    gradeLabel,
    color,
    badgeBg,
    badgeBorder,
    badgeText,
    displayLabel,
    cutoffs
  };
}

/**
 * Calculates absolute overall grade across total test scores (out of 50 marks):
 * - Grade A: >= 80% (40 - 50 marks)
 * - Grade B: 50% - 79% (25 - 39 marks)
 * - Grade C: < 50% (0 - 24 marks)
 */
export function calculateRelativeOverallGrade(
  overallScore: number,
  allSubmissions: SavedSubmission[] = [],
  studentDept: string = 'General',
  maxScore: number = 50
): RelativeOverallGradeResult {
  let collegeScores = allSubmissions.map((s) => s.report?.overallScore ?? 0);
  if (collegeScores.length === 0) collegeScores = [overallScore];

  const deptTrimmed = (studentDept || 'General').trim().toLowerCase();
  let deptScores = allSubmissions
    .filter((s) => (s.student?.department || 'General').trim().toLowerCase() === deptTrimmed)
    .map((s) => s.report?.overallScore ?? 0);
  if (deptScores.length === 0) deptScores = [overallScore];

  const collegePercentile = computePercentileRank(overallScore, collegeScores);
  const deptPercentile = computePercentileRank(overallScore, deptScores);
  const percentage = maxScore > 0 ? (overallScore / maxScore) * 100 : 0;

  let grade: RelativeGrade = 'C';
  let gradeLabel = 'Grade C (<50% / 0–24 Marks)';
  let title = 'Developing (<50%)';
  let color = '#EA580C';
  let badgeBg = 'bg-rose-100';
  let badgeBorder = 'border-rose-300';
  let badgeText = 'text-rose-800';
  let description = 'Absolute Grading: Below 50% (0–24 Marks out of 50).';

  if (percentage >= 80) {
    grade = 'A';
    gradeLabel = 'Grade A (≥80% / 40–50 Marks)';
    title = 'Distinction (≥80%)';
    color = '#10B981';
    badgeBg = 'bg-emerald-100';
    badgeBorder = 'border-emerald-300';
    badgeText = 'text-emerald-800';
    description = 'Absolute Grading: 80%–100% (40–50 Marks out of 50).';
  } else if (percentage >= 50) {
    grade = 'B';
    gradeLabel = 'Grade B (50%–79% / 25–39 Marks)';
    title = 'Merit / Proficient (50%–79%)';
    color = '#3B82F6';
    badgeBg = 'bg-blue-100';
    badgeBorder = 'border-blue-300';
    badgeText = 'text-blue-800';
    description = 'Absolute Grading: 50%–79% (25–39 Marks out of 50).';
  }

  return {
    grade,
    collegePercentile: Math.round(collegePercentile),
    deptPercentile: Math.round(deptPercentile),
    gradeLabel,
    title,
    color,
    badgeBg,
    badgeBorder,
    badgeText,
    description,
    cutoffs: {
      gradeACutoff: Math.ceil(maxScore * 0.8), // 40
      gradeBCutoff: Math.ceil(maxScore * 0.5), // 25
      isSmallSample: false,
      totalCollegeStudents: collegeScores.length
    }
  };
}

export interface DomainMarkLimitRow {
  sNo: number;
  domainId: SectionId | 'overall';
  domainName: string;
  maxMarks: number;
  gradeAFrom: number;
  gradeATo: number;
  gradeBFrom: number;
  gradeBTo: number;
  gradeCFrom: number;
  gradeCTo: number;
  totalStudents: number;
  isSmallSample: boolean;
}

/**
 * Computes the fixed Absolute Mark Limits (From and To) for Grade A (>=80%), Grade B (50%-79%),
 * and Grade C (<50%) for a specific domain.
 */
export function computeDomainMarkLimits(
  domainId: SectionId,
  domainName: string,
  submissions: SavedSubmission[],
  sNo: number,
  maxMarks: number = 10
): DomainMarkLimitRow {
  const totalStudents = (submissions || []).length;
  const gradeAFrom = Math.ceil(maxMarks * 0.8); // 8 for 10 marks
  const gradeATo = maxMarks; // 10
  const gradeBFrom = Math.ceil(maxMarks * 0.5); // 5 for 10 marks
  const gradeBTo = gradeAFrom - 1; // 7 for 10 marks
  const gradeCFrom = 0;
  const gradeCTo = gradeBFrom - 1; // 4 for 10 marks

  return {
    sNo,
    domainId,
    domainName,
    maxMarks,
    gradeAFrom,
    gradeATo,
    gradeBFrom,
    gradeBTo,
    gradeCFrom,
    gradeCTo,
    totalStudents,
    isSmallSample: false
  };
}

/**
 * Computes Absolute Mark Limits (From and To) for all 5 domains and overall 50-mark assessment.
 */
export function computeAllDomainMarkLimits(submissions: SavedSubmission[]): DomainMarkLimitRow[] {
  const domains: { id: SectionId; name: string }[] = [
    { id: 'calculus', name: 'Limits & Continuity' },
    { id: 'probability', name: 'Differentiation' },
    { id: 'numberSystem', name: 'Integration' },
    { id: 'trigonometry', name: 'Probability & Statistics' },
    { id: 'statistics', name: 'Matrices & Determinants' }
  ];

  const domainRows = domains.map((d, index) =>
    computeDomainMarkLimits(d.id, d.name, submissions, index + 1, 10)
  );

  const totalStudents = (submissions || []).length;

  domainRows.push({
    sNo: 6,
    domainId: 'overall',
    domainName: 'Overall Assessment Benchmark (Total Score)',
    maxMarks: 50,
    gradeAFrom: 40,
    gradeATo: 50,
    gradeBFrom: 25,
    gradeBTo: 39,
    gradeCFrom: 0,
    gradeCTo: 24,
    totalStudents,
    isSmallSample: false
  });

  return domainRows;
}

/**
 * Standard disclaimer note required on any grade display:
 */
export const RELATIVE_GRADING_DISCLAIMER =
  'Grade is based on absolute academic score thresholds: Grade A (≥80%), Grade B (50%–79%), Grade C (<50%).';
