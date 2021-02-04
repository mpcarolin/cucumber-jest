declare type ElementProps = {
    dataId?: string;
    id?: string;
    name?: string;
    selector?: string;
};
export default class Element {
    private readonly _selector;
    private _element;
    constructor(props: ElementProps);
    blur(): Promise<void>;
    click(): Promise<void>;
    focus(): Promise<void>;
    getAttribute(attr: string): any;
    getValue(): string;
    innerText(): string;
    isInDom(): boolean;
    setValue(value: string, isMask?: boolean): Promise<void>;
    waitForEnabled(): Promise<void>;
    waitForInDom(): Promise<void>;
    waitForNotInDom(): Promise<void>;
}
export {};
