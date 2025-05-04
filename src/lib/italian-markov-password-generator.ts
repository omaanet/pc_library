/**
 * Configuration options for password generation
 */
export interface PasswordOptions {
    minLength?: number;
    maxLength?: number;
    includeNumber?: boolean;
    includeSpecial?: boolean;
    capitalizeStart?: boolean;
    substitutionRate?: number;
    markovOrder?: number;
    naturalEnding?: boolean;
}

/**
 * Types for the Markov model
 */
export type TransitionFrequency = Map<string, number>;
export type MarkovState = Map<string, TransitionFrequency>;

/**
 * Advanced Italian Phonetic Password Generator
 * Uses optimized Markov chains to create memorable Italian-sounding passwords
 */
export class ItalianMarkovPasswordGenerator {
    private static readonly VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);
    private static readonly COMMON_CONSONANTS = new Set(['b', 'c', 'd', 'f', 'g', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v']);
    private static readonly NUMBERS = '0123456789';
    private static readonly SPECIAL_CHARS = '!@#$%^&*._-+=?';
    private static readonly MEMORABLE_NUMBERS = ["12", "23", "45", "67", "89", "10", "20", "30", "50", "90"];
    private static readonly SUBSTITUTIONS: ReadonlyMap<string, string> = new Map([
        ['a', '@'], ['i', '1'], ['e', '3'], ['o', '0'],
        ['s', '5'], ['z', '2'], ['t', '7'], ['l', '1']
    ]);
    private static readonly VOWEL_ENDINGS = ['a', 'e', 'i', 'o'];
    private static readonly TWO_LETTER_ENDINGS = ['to', 'ta', 'no', 'na', 'ri', 're', 'le', 'lo', 'la'];
    private static readonly VOWELS_ARRAY = Array.from(ItalianMarkovPasswordGenerator.VOWELS);
    private static readonly CONSONANTS_ARRAY = Array.from(ItalianMarkovPasswordGenerator.COMMON_CONSONANTS);
    private static randomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    private markovModel: MarkovState;
    private startChars: string[];
    private transitionTotals: Map<string, number>;

    private static readonly DEFAULT_CONFIG: Required<PasswordOptions> = {
        minLength: 8,
        maxLength: 12,
        includeNumber: true,
        includeSpecial: false,
        capitalizeStart: true,
        substitutionRate: 0.2,
        markovOrder: 2,
        naturalEnding: true
    };

    constructor() {
        this.markovModel = new Map();
        this.startChars = [];
        this.transitionTotals = new Map();
        this.initializeMarkovModel();
    }

    private initializeMarkovModel(): void {
        this.startChars = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'i', 'l', 'm', 'n', 'o', 'p', 'r', 's', 't', 'v'];
        const italianBigrams: string[] = [
            'in', 'di', 'ch', 'la', 'il', 'er', 'un', 're', 'co', 'to',
            'an', 'ri', 'le', 'ar', 'ta', 'on', 'si', 'en', 'no', 'li',
            'ra', 'al', 'ro', 'de', 'ti', 'io', 'es', 'ci', 'ca', 'te',
            'el', 'ia', 'ol', 'pa', 'do', 'sc', 'fi', 'vi', 'st', 'pr'
        ];

        for (const char of this.startChars) {
            this.addStateTransitions(char, this.buildInitialTransitions(char));
        }
        for (const bigram of italianBigrams) {
            const first = bigram[0];
            const second = bigram[1];
            this.ensureStateExists(first);
            this.addTransition(first, second, this.getRandomFrequency(15, 30));
            this.ensureStateExists(bigram);
            this.addTransitionsFromBigram(bigram, second);
        }
        this.addItalianSpecificPatterns();
        this.precomputeTransitionTotals();
    }

    private ensureStateExists(state: string): void {
        if (!this.markovModel.has(state)) {
            this.markovModel.set(state, new Map());
        }
    }

    private addStateTransitions(state: string, transitions: Map<string, number>): void {
        this.ensureStateExists(state);
        for (const [nextChar, frequency] of transitions.entries()) {
            this.addTransition(state, nextChar, frequency);
        }
    }

    private addTransition(state: string, nextChar: string, frequency: number): void {
        this.ensureStateExists(state);
        const stateTransitions = this.markovModel.get(state)!;
        stateTransitions.set(nextChar, (stateTransitions.get(nextChar) || 0) + frequency);
    }

    private buildInitialTransitions(char: string): Map<string, number> {
        const transitions = new Map<string, number>();
        if (!ItalianMarkovPasswordGenerator.VOWELS.has(char)) {
            for (const vowel of ItalianMarkovPasswordGenerator.VOWELS) {
                transitions.set(vowel, this.getRandomFrequency(5, 20));
            }
        } else {
            for (const consonant of ItalianMarkovPasswordGenerator.COMMON_CONSONANTS) {
                transitions.set(consonant, this.getRandomFrequency(5, 15));
            }
        }
        return transitions;
    }

    private addTransitionsFromBigram(bigram: string, lastChar: string): void {
        if (ItalianMarkovPasswordGenerator.VOWELS.has(lastChar)) {
            for (const consonant of ItalianMarkovPasswordGenerator.COMMON_CONSONANTS) {
                this.addTransition(bigram, consonant, this.getRandomFrequency(5, 15));
            }
        } else {
            for (const vowel of ItalianMarkovPasswordGenerator.VOWELS) {
                this.addTransition(bigram, vowel, this.getRandomFrequency(10, 20));
            }
        }
    }

    private addItalianSpecificPatterns(): void {
        const patterns: [string, string, number][] = [
            ['c', 'i', 15], ['c', 'a', 12], ['c', 'o', 10], ['c', 'h', 18], ['c', 'e', 10],
            ['g', 'i', 12], ['g', 'a', 10], ['g', 'o', 8], ['g', 'h', 14], ['g', 'e', 8],
            ['g', 'n', 10], ['g', 'l', 8],
            ['sc', 'i', 15], ['sc', 'h', 15], ['sc', 'e', 10], ['sc', 'a', 8],
            ['ch', 'i', 15], ['ch', 'e', 12], ['ch', 'a', 5],
            ['gh', 'i', 15], ['gh', 'e', 12],
            ['gl', 'i', 20], ['gn', 'a', 10], ['gn', 'i', 8], ['gn', 'o', 6],
            ['qu', 'a', 12], ['qu', 'e', 10], ['qu', 'i', 8],
            ['ci', 'a', 10], ['ci', 'o', 8], ['ci', 'e', 5],
            ['gi', 'a', 10], ['gi', 'o', 8], ['gi', 'e', 5],
            ['zz', 'a', 12], ['zz', 'i', 10], ['zz', 'o', 8], ['zz', 'e', 8],
            ['tt', 'a', 10], ['tt', 'i', 10], ['tt', 'o', 8], ['tt', 'e', 8],
            ['nn', 'a', 10], ['nn', 'i', 8], ['nn', 'o', 6], ['nn', 'e', 6],
            ['ss', 'a', 10], ['ss', 'i', 10], ['ss', 'o', 8], ['ss', 'e', 8],
            ['rr', 'a', 10], ['rr', 'i', 10], ['rr', 'o', 8], ['rr', 'e', 8],
            ['ll', 'a', 10], ['ll', 'i', 10], ['ll', 'o', 8], ['ll', 'e', 8],
            ['pp', 'a', 10], ['pp', 'i', 8], ['pp', 'o', 6], ['pp', 'e', 5],
            ['mm', 'a', 10], ['mm', 'i', 8], ['mm', 'o', 6], ['mm', 'e', 6],
            ['in', 'i', 5], ['in', 'a', 8], ['in', 'o', 6], ['in', 'e', 5], ['in', 't', 5], ['in', 's', 5], ['in', 'f', 5], ['in', 'c', 5],
            ['di', 'n', 5], ['di', 'a', 5], ['di', 's', 5], ['di', 'c', 5], ['di', 'r', 5], ['di', 'v', 4],
            ['ri', 'a', 8], ['ri', 'o', 6], ['ri', 'e', 5], ['ri', 's', 5], ['ri', 'c', 5], ['ri', 't', 5], ['ri', 'n', 4],
            ['to', 'r', 10], ['to', 'n', 5], ['to', 's', 5], ['to', 'l', 5],
            ['co', 'n', 10], ['co', 'm', 8], ['co', 'r', 5], ['co', 'l', 5], ['co', 's', 5],
            ['on', 'e', 10], ['on', 'i', 5], ['on', 'a', 5], ['on', 'o', 5], ['on', 't', 5], ['on', 's', 5],
            ['le', 't', 8], ['le', 'n', 5], ['le', 'r', 5], ['le', 's', 5], ['le', 'g', 4], ['le', 'v', 3]
        ];
        for (const [state, nextChar, frequency] of patterns) {
            this.addTransition(state, nextChar, frequency);
        }
    }

    private precomputeTransitionTotals(): void {
        for (const [state, transitions] of this.markovModel.entries()) {
            let total = 0;
            for (const frequency of transitions.values()) {
                total += frequency;
            }
            this.transitionTotals.set(state, total);
        }
    }

    public getRandomFrequency(min: number, max: number): number {
        return ItalianMarkovPasswordGenerator.randomInt(min, max);
    }

    public generatePassword(options: PasswordOptions = {}): string {
        const config = { ...ItalianMarkovPasswordGenerator.DEFAULT_CONFIG, ...options };
        const extraChars = (config.includeNumber ? 2 : 0) + (config.includeSpecial ? 1 : 0);
        const availableLength = config.maxLength - extraChars;
        const minBaseLength = Math.max(3, config.minLength - extraChars);
        const baseLength = minBaseLength + ItalianMarkovPasswordGenerator.randomInt(0, availableLength - minBaseLength);
        const passwordChars = this.generateMarkovSequence(baseLength, config.markovOrder);
        if (config.naturalEnding) this.applyNaturalEnding(passwordChars);
        let password = passwordChars.join('');
        if (config.substitutionRate > 0) password = this.applySubstitutions(password, config.substitutionRate);
        if (config.capitalizeStart && password.length > 0) password = password.charAt(0).toUpperCase() + password.slice(1);
        if (config.includeNumber) password += ItalianMarkovPasswordGenerator.MEMORABLE_NUMBERS[
            ItalianMarkovPasswordGenerator.randomInt(0, ItalianMarkovPasswordGenerator.MEMORABLE_NUMBERS.length - 1)
        ];
        if (config.includeSpecial) password += ItalianMarkovPasswordGenerator.SPECIAL_CHARS.charAt(
            ItalianMarkovPasswordGenerator.randomInt(0, ItalianMarkovPasswordGenerator.SPECIAL_CHARS.length - 1)
        );
        return password;
    }

    private generateMarkovSequence(length: number, order: number): string[] {
        const result: string[] = [];
        result.push(this.startChars[ItalianMarkovPasswordGenerator.randomInt(0, this.startChars.length - 1)]);
        while (result.length < length) {
            const stateLength = Math.min(order, result.length);
            const currentState = result.slice(-stateLength).join('');
            result.push(this.getNextCharacter(currentState, order));
        }
        return result;
    }

    private getNextCharacter(state: string, order: number): string {
        if (this.markovModel.has(state)) return this.selectRandomTransition(state);
        if (order > 1 && state.length > 1) {
            const shorter = state.slice(-1);
            if (this.markovModel.has(shorter)) return this.selectRandomTransition(shorter);
        }
        return this.startChars[ItalianMarkovPasswordGenerator.randomInt(0, this.startChars.length - 1)];
    }

    private selectRandomTransition(state: string): string {
        const transitions = this.markovModel.get(state)!;
        const total = this.transitionTotals.get(state) || 0;
        if (total === 0 || transitions.size === 0) {
            return ItalianMarkovPasswordGenerator.VOWELS_ARRAY[
                ItalianMarkovPasswordGenerator.randomInt(0, ItalianMarkovPasswordGenerator.VOWELS_ARRAY.length - 1)
            ];
        }
        const point = Math.floor(Math.random() * total);
        let cum = 0;
        for (const [char, freq] of transitions.entries()) {
            cum += freq; if (point < cum) return char;
        }
        return transitions.keys().next().value!;
    }

    private applyNaturalEnding(chars: string[]): void {
        if (chars.length <= 3) return;
        const last = chars[chars.length - 1];
        if (ItalianMarkovPasswordGenerator.VOWEL_ENDINGS.includes(last)) return;
        if (ItalianMarkovPasswordGenerator.randomInt(0, 1) === 1 && chars.length > 3) {
            const s = ItalianMarkovPasswordGenerator.TWO_LETTER_ENDINGS[
                ItalianMarkovPasswordGenerator.randomInt(0, ItalianMarkovPasswordGenerator.TWO_LETTER_ENDINGS.length - 1)
            ];
            chars.splice(chars.length - 2, 2, s[0], s[1]);
        } else {
            chars[chars.length - 1] = ItalianMarkovPasswordGenerator.VOWEL_ENDINGS[
                ItalianMarkovPasswordGenerator.randomInt(0, ItalianMarkovPasswordGenerator.VOWEL_ENDINGS.length - 1)
            ];
        }
    }

    private applySubstitutions(password: string, rate: number): string {
        return password.split('').map(c => ItalianMarkovPasswordGenerator.SUBSTITUTIONS.has(c) && Math.random() < rate
            ? ItalianMarkovPasswordGenerator.SUBSTITUTIONS.get(c)! : c).join('');
    }
}
