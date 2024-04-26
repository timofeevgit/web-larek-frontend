import { Component } from "../base/component";
import { ensureElement } from "../../utils/utils";
import { ISuccess, ISuccessActions } from "../../types/index"

export class Success extends Component<ISuccess> {
    protected _close: HTMLElement;
    protected _total: HTMLElement;

    constructor(container: HTMLElement, synapses: number, actions: ISuccessActions) {
        super(container);

        this._total = ensureElement<HTMLElement>('.order-success__description', this.container);
        this._close = ensureElement<HTMLElement>('.order-success__close', this.container);

        this.setText(this._total, 'списано ' + synapses + ' синапсов');

        this._close.addEventListener('click', actions.onClick);
    };
};