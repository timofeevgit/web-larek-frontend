import { Model } from "./base/model";
import { IAppState, IOrder, IProductItem, FormErrors, PayMethod } from "../types";
import { IContacts } from "../types";

export type CatalogChangeEvent = {
  catalog: IProductItem[]
};

export class AppState extends Model<IAppState> {
  basket: IProductItem[] = [];
  catalog: IProductItem[] = [];
  order: IOrder = {
      email: '',
      phone: '',
      items: [],
      payment: 'card',
      address: '',
      total: 0
  };
  preview: string | null;
  formErrors: FormErrors = {};

  throwInBasket(item: IProductItem): void {
      this.basket.push(item);
      this.emitChanges('basket:change');
  }

  removeInBasket(id: string): void {
      this.basket = this.basket.filter((item) => item.id !== id);
      this.emitChanges('basket:change');
  }

  clearOrder(): void {
      this.order = {
          email: '',
          phone: '',
          items: [],
          payment: 'card',
          address: '',
          total: 0
      }
  }

  clearBasket(): void {
      this.basket = [];
      this.clearOrder();
      this.emitChanges('basket:change');
  }

  getTotal() {
      return this.basket.reduce((summ, product) => summ + product.price, 0);
  }

  setCatalog(items: IProductItem[]) {
      this.catalog = items;
      this.emitChanges('items:changed', { catalog: this.catalog });
  }

  setPreview(item: IProductItem) {
      this.preview = item.id;
      this.emitChanges('preview:changed', item);
  }

  checkContentBasket(): IProductItem[] {
      return this.basket
  }

  checkBasket(item: IProductItem) {
      return this.basket.includes(item);
  }

  setOrder(): void {
      this.order.total = this.getTotal();
      this.order.items = this.checkContentBasket().map((item) => item.id);
  }

  setOrderField(field: keyof Partial<IContacts>, value: string): void {
      this.order[field] = value;
      this.validateOrderContacts();
  }

  setPayment(itemPayment: PayMethod): void {
      this.order.payment = itemPayment;
      this.validateOrderPay();
  }

  setAddress(itemAddress: string): void {
      this.order.address = itemAddress;
      this.validateOrderPay();
  }

  setEmail(itemEmail: string): void {
      this.order.email = itemEmail;
      this.validateOrderContacts();
  }

  setPhone(itemPhone: string): void {
      this.order.phone = itemPhone;
      this.validateOrderContacts();
  }

  validateOrderPay(): boolean  {
      const errors: FormErrors = {};
      // пробуем через условие
      if (!this.order.payment) {
          errors.payment = 'Выберите способо оплаты';
      }
      if (!this.order.address) {
          errors.address = 'Укажите адрес доставки';
      }
      this.formErrors = errors;
      this.events.emit('formErrors:change', this.formErrors);
      return Object.keys(errors).length === 0;
  }

  validateOrderContacts(): boolean  {
      const errors: FormErrors = {};
      // пробуем тернарный оператор
      errors.email = !this.order.email ? 'Ведите email' : '';
      errors.phone = !this.order.phone ? 'Введите номер телефона' : '';
      this.formErrors = errors;
      this.events.emit('formContactsErrors:change', this.formErrors);
      return Object.keys(errors).length === 0;
  }
}