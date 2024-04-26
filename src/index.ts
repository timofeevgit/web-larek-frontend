import './scss/styles.scss';
import { ensureElement, createElement, cloneTemplate } from './utils/utils';
import { EventEmitter } from './components/base/events';
import { API_URL, CDN_URL } from "./utils/constants";
import { WebLarekAPI } from './components/WebLarekAPI';
import { AppState, CatalogChangeEvent } from './components/AppData';
import { Page } from './components/Page';
import { Card, CardBasket } from './components/common/card';
import { Modal } from './components/common/modal';
import { Basket } from './components/common/basket';
import { Order } from './components/common/order';
import { Contacts } from './components/common/contacts';
import { Success } from './components/common/success';
import { PayMethod, IOrder, IProductItem, IContacts } from './types/index'

const cardCatalogTemplate = ensureElement<HTMLTemplateElement>('#card-catalog');
const cardPreviewTemplate = ensureElement<HTMLTemplateElement>('#card-preview');
const cardBasketTemplate = ensureElement<HTMLTemplateElement>('#card-basket');
const basketTemplate = ensureElement<HTMLTemplateElement>('#basket');
const orderTemplate = ensureElement<HTMLTemplateElement>('#order');
const contactsTemplate = ensureElement<HTMLTemplateElement>('#contacts');
const successTemplate = ensureElement<HTMLTemplateElement>('#success');

const events = new EventEmitter();
const api = new WebLarekAPI(CDN_URL, API_URL);
const appData = new AppState({}, events);

const page = new Page(document.body, events);
const modal = new Modal(ensureElement<HTMLElement>('#modal-container'), events);

const basket = new Basket(cloneTemplate(basketTemplate), events);
const order = new Order(cloneTemplate(orderTemplate), events);
const contacts = new Contacts(cloneTemplate(contactsTemplate), events);

//Изменились элементы каталога
events.on<CatalogChangeEvent>('items:changed', () => {
    page.catalog = appData.catalog.map(item => {
        const card = new Card('card', cloneTemplate(cardCatalogTemplate), {
            onClick: () => events.emit('card:select', item)
        });
        return card.render({
            title: item.title,
            image: item.image,
            category: item.category,
            price: item.price,
        });
    });

    page.counter = appData.checkContentBasket().length;
});

// Предварительный просмотр карточки
events.on('card:select', (item: IProductItem) => {
    appData.setPreview(item);
});

events.on('preview:changed', (item: IProductItem) => {
    if (item) {
        const card = new Card('card', cloneTemplate(cardPreviewTemplate), {
            onClick: () => {
                if (appData.checkBasket(item)) {
                    events.emit('webitem:delete', item);
                } else {
                    events.emit('webitem:added', item)
                }
            }
        });

        modal.render({
            content: card.render({
                title: item.title,
                image: item.image,
                category: item.category,
                description: item.description,
                price: item.price,
                button: appData.checkBasket(item) ? 'Убрать' : 'Купить'
            }),
        })
        console.log(card)
    } else {
        modal.close();
    }
});

// Добавить товар в корзину
events.on('webitem:added', (item: IProductItem) => {
    appData.throwInBasket(item);
    modal.close();
})

// Удалить товар из корзины
events.on('webitem:delete', (item: IProductItem) => {
    appData.removeInBasket(item.id);
    modal.close();
})

// Открыть модальное окно с заказом
events.on('order:open', () => {
    order.setClass('card');
    appData.setPayment('card');
    modal.render({
        content: order.render({
            address: '',
            valid: false,
            errors: [],
        }),
    });
});

// Отправлена формы доставки
events.on('order:submit', () => {
    modal.render({
        content: contacts.render({
            phone: '',
            email: '',
            valid: false,
            errors: [],
        }),
    });
});

// Открыть модальное окно с контактами
events.on('contacts:open', () => {
    modal.render({
        content: contacts.render({
            phone: '',
            email: '',
            valid: false,
            errors: [],
        }),
    });
});

// Выбрать способ оплаты
events.on('payment:changed', (data: { target: PayMethod }) => {
    appData.setPayment(data.target);
});

// Изменилось состояние валидации заказа
events.on('formErrors:change', (errors: Partial<IOrder>) => {
    const { payment, address } = errors;
    order.valid = !payment && !address;
    order.errors = Object.values({ payment, address })
        .filter((i) => !!i)
        .join('; ');
});

// Изменилось состояние валидации контактов
events.on('formContactsErrors:change', (errors: Partial<IContacts>) => {
    const { email, phone } = errors;
    contacts.valid = !email && !phone;
    contacts.errors = Object.values({ phone, email })
        .filter(i => !!i)
        .join('; ');
});

// Изменилось одно из полей контактов
events.on(/^contacts\..*:change/,
    (data: { field: keyof IContacts, value: string }) => {
        appData.setOrderField(data.field, data.value);
    });

// Изменился адрес доставки
events.on('order.address:change',
    (data: { value: string }) => {
        appData.setAddress(data.value);
    });

// Открыть корзину
events.on('basket:open', () => {
    modal.render({
        content: createElement<HTMLElement>('div', {}, [basket.render()]),
    })
});

// Отображение содержимого корзины
events.on('basket:change', () => {
    const contentBasket = appData.checkContentBasket();
    page.counter = contentBasket.length;
    basket.items = contentBasket.map((product, index) => {
        const card = new CardBasket(index, cloneTemplate(cardBasketTemplate), {
            onClick: () => {
                appData.removeInBasket(product.id);
                basket.total = appData.getTotal();
            }
        });
        return card.render({ title: product.title, price: product.price });
    });
   
});

// Отправить данные о пользователе на сервер
events.on('contacts:submit', () => {
    appData.setOrder();
    api.orderProducts(appData.order)
        .then(() => {
            const success = new Success(cloneTemplate(successTemplate), appData.order.total, {
                onClick: () => {
                    modal.close();
                    appData.clearBasket();
                    order.setClass('');
                    events.emit('basket:change');
                }
            });
            modal.render({ content: success.render({}) });
            appData.clearBasket();
        })
        .catch((err) => {
            console.error(err);
        });
});

// Изменились данные в корзине
events.on('basket:change', () => {
    page.counter = appData.checkContentBasket().length;
    basket.items = appData.checkContentBasket().map((product, index) => {
        const card = new CardBasket(index, cloneTemplate(cardBasketTemplate), {
            onClick: () => {
                appData.removeInBasket(product.id);
                basket.total = appData.getTotal();
            },
        });
        return card.render({ title: product.title, price: product.price });
    });
    basket.total = appData.getTotal();
});

events.on('modal:open', () => {
    page.locked = true;
});

events.on('modal:close', () => {
    page.locked = false;
});

api.getProductList()
    .then(appData.setCatalog.bind(appData))
    .catch(err => {
        console.error(err);
    });


