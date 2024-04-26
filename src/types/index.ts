export interface IProductItem {
  id: string;
  title: string;
  name: string;
  price: number | null;
  description?: string;
  image: string;
  category: string;
}

export interface IOrder {
  payment: PayMethod;
  email: string;
  phone: string;
  address: string;
  total: number;
  items: string[];
}

export interface IOrderResult {
  id: number;
  total: number;
}

export interface IAppState {
  catalog: IProductItem[];
  basket: string[];
  order: IOrder | null;
}

export interface IContacts {
  email: string;
  phone: string;
}

export interface IFormState {
  valid: boolean;
  errors: string[];
}

export interface IModalData {
  content: HTMLElement;
}

export interface ISuccess {
  total: number;
}

export interface ISuccessActions {
  onClick: () => void;
}

export interface IBasketView {
  items: HTMLElement,
  total: number
}

export interface ICardBasket {
  title: string;
  price: number;
}

export interface ICardActions {
  onClick: (event: MouseEvent) => void;
}


export type PayMethod = 'cash' | 'card';
export type FormErrors = Partial<Record<keyof IOrder, string>>;