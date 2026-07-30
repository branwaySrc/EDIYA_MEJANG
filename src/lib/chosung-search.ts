const CHOSUNG = [
	"ㄱ",
	"ㄲ",
	"ㄴ",
	"ㄷ",
	"ㄸ",
	"ㄹ",
	"ㅁ",
	"ㅂ",
	"ㅃ",
	"ㅅ",
	"ㅆ",
	"ㅇ",
	"ㅈ",
	"ㅉ",
	"ㅊ",
	"ㅋ",
	"ㅌ",
	"ㅍ",
	"ㅎ",
] as const;

export type ChosungSearchOptions<T> = {
	getChosungText?: (item: T) => string | undefined;
	getText: (item: T) => string;
	limit?: number;
	query: string;
};

export type ChosungSearchHighlightRange = {
	end: number;
	start: number;
};

export type ChosungSearchMatch<T> = {
	highlightRange?: ChosungSearchHighlightRange;
	item: T;
};

type MatchResult = {
	highlightRange?: ChosungSearchHighlightRange;
	score: number;
};

type CompactIndex = {
	text: string;
	textToSourceIndex: number[];
};

function compact(text: string) {
	return text.trim().toLowerCase().replace(/\s/g, "");
}

function getChosungChar(char: string) {
	const code = char.charCodeAt(0) - 0xac00;

	if (code < 0 || code > 11171) {
		return char;
	}

	return CHOSUNG[Math.floor(code / 588)];
}

function createCompactIndex(text: string, transform: (char: string) => string = char => char): CompactIndex {
	return [...text].reduce<CompactIndex>(
		(result, char, sourceIndex) => {
			if (/\s/.test(char)) {
				return result;
			}

			result.text += transform(char).toLowerCase();
			result.textToSourceIndex.push(sourceIndex);

			return result;
		},
		{ text: "", textToSourceIndex: [] },
	);
}

function getHighlightRange(index: CompactIndex, matchStart: number, queryLength: number) {
	const sourceStart = index.textToSourceIndex[matchStart];
	const sourceEnd = index.textToSourceIndex[matchStart + queryLength - 1];

	if (sourceStart === undefined || sourceEnd === undefined) {
		return undefined;
	}

	return {
		start: sourceStart,
		end: sourceEnd + 1,
	};
}

export function getChosung(text: string) {
	return [...text].map(getChosungChar).join("");
}

function getMatchResult(text: string, query: string, chosung?: string): MatchResult {
	const normalizedQuery = compact(query);

	if (!normalizedQuery) {
		return { score: 0 };
	}

	const textIndex = createCompactIndex(text);
	const textMatchStart = textIndex.text.indexOf(normalizedQuery);

	if (textIndex.text === normalizedQuery) {
		return {
			score: 1000,
			highlightRange: getHighlightRange(textIndex, 0, normalizedQuery.length),
		};
	}

	if (textMatchStart === 0) {
		return {
			score: 900,
			highlightRange: getHighlightRange(textIndex, textMatchStart, normalizedQuery.length),
		};
	}

	if (textMatchStart > 0) {
		return {
			score: 800 - textMatchStart,
			highlightRange: getHighlightRange(textIndex, textMatchStart, normalizedQuery.length),
		};
	}

	const fallbackChosungIndex = createCompactIndex(text, getChosungChar);
	const chosungIndex = chosung
		? { text: compact(chosung), textToSourceIndex: fallbackChosungIndex.textToSourceIndex }
		: fallbackChosungIndex;
	const chosungMatchStart = chosungIndex.text.indexOf(normalizedQuery);

	if (chosungMatchStart === 0) {
		return {
			score: 700,
			highlightRange: getHighlightRange(chosungIndex, chosungMatchStart, normalizedQuery.length),
		};
	}

	if (chosungMatchStart > 0) {
		return {
			score: 600 - chosungMatchStart,
			highlightRange: getHighlightRange(chosungIndex, chosungMatchStart, normalizedQuery.length),
		};
	}

	return { score: -1 };
}

export function chosungSearchWithMatches<T>({
	getChosungText,
	getText,
	limit,
	query,
}: ChosungSearchOptions<T>, items: T[]): ChosungSearchMatch<T>[] {
	const normalizedQuery = compact(query);

	if (!normalizedQuery) {
		return [];
	}

	const matches = items
		.map((item, index) => {
			const text = getText(item);
			const match = getMatchResult(text, normalizedQuery, getChosungText?.(item));

			return { index, item, match, text };
		})
		.filter(result => result.match.score >= 0)
		.sort((a, b) => {
			if (b.match.score !== a.match.score) {
				return b.match.score - a.match.score;
			}

			if (a.text.length !== b.text.length) {
				return a.text.length - b.text.length;
			}

			return a.index - b.index;
		})
		.map(result => ({
			item: result.item,
			highlightRange: result.match.highlightRange,
		}));

	if (limit === undefined) {
		return matches;
	}

	return matches.slice(0, limit);
}

export function chosungSearch<T>(options: ChosungSearchOptions<T>, items: T[]) {
	const normalizedQuery = compact(options.query);

	if (!normalizedQuery) {
		return items;
	}

	return chosungSearchWithMatches(options, items).map(result => result.item);
}
