declare module 'bad-words' {
    interface Options {
        emptyList?: boolean;
        list?: string[];
        placeHolder?: string;
        regex?: RegExp;
        replaceRegex?: RegExp;
        splitRegex?: RegExp;
    }

    export class Filter {
        constructor(options?: Options);
        isProfane(string: string): boolean;
        replaceWord(string: string): string;
        clean(string: string): string;
        addWords(...words: string[]): void;
        removeWords(...words: string[]): void;
    }
}
