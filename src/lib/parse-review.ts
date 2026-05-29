export interface ParsedReview {
  score: number;
  reasoning: string;
  strongPoints: string[];
  weakSentences: Array<{ quote: string; issue: string }>;
  improvements: string[];
  quickWins: string[];
  assessment: string;
}

export function parseReviewResponse(text: string): ParsedReview {
  const lines = text.split('\n');

  const result: ParsedReview = {
    score: 0,
    reasoning: '',
    strongPoints: [],
    weakSentences: [],
    improvements: [],
    quickWins: [],
    assessment: '',
  };

  let currentSection = '';

  for (const line of lines) {
    if (line.startsWith('SCORE:')) {
      result.score = parseInt(line.match(/\d+/)?.[0] || '0');
    } else if (line.startsWith('REASONING:')) {
      result.reasoning = line.replace('REASONING:', '').trim();
    } else if (line.startsWith('STRONG POINTS:')) {
      currentSection = 'strongPoints';
    } else if (line.startsWith('WEAK SENTENCES:')) {
      currentSection = 'weakSentences';
    } else if (line.startsWith('TOP 5 IMPROVEMENTS:')) {
      currentSection = 'improvements';
    } else if (line.startsWith('QUICK WINS')) {
      currentSection = 'quickWins';
    } else if (line.startsWith('OVERALL ASSESSMENT:')) {
      currentSection = 'assessment';
    } else if (line.trim().startsWith('-') || line.trim().match(/^\d+\./)) {
      const content = line.replace(/^[-•\d.]\s*/, '').trim();

      if (currentSection === 'strongPoints') {
        result.strongPoints.push(content);
      } else if (currentSection === 'quickWins') {
        result.quickWins.push(content);
      } else if (currentSection === 'improvements') {
        result.improvements.push(content);
      }
    } else if (currentSection === 'weakSentences' && line.includes('→')) {
      const [quote, issue] = line.split('→') as [string, string];
      result.weakSentences.push({
        quote: quote.replace(/^[-•]\s*/, '').trim(),
        issue: issue.trim(),
      });
    } else if (currentSection === 'assessment' && line.trim()) {
      result.assessment += line + ' ';
    }
  }

  result.assessment = result.assessment.trim();

  return result;
}
