export const ru = {
  nav: {
    chats: 'Чаты',
    signOut: 'Выйти',
  },
  signOutDialog: {
    title: 'Выйти?',
    description: 'Чаты и сообщения на этом устройстве будут удалены',
    cancel: 'Нет',
    confirm: 'Да',
  },
  auth: {
    title: 'Вход в GREEN-API',
    subtitle: 'Данные инстанса — в личном кабинете GREEN-API',
    consoleLink: 'Открыть кабинет',
    idInstance: 'idInstance',
    apiTokenInstance: 'apiTokenInstance',
    advanced: 'Дополнительно',
    apiUrl: 'apiUrl',
    apiUrlHint: (defaultUrl: string) => `Если пусто — ${defaultUrl}`,
    submit: 'Войти',
    submitting: 'Проверяем…',
    errors: {
      required: 'Заполните поле',
      idInstance: 'Только цифры',
      apiUrl: 'Некорректный адрес',
      wrongCredentials: 'Неверный idInstance или apiTokenInstance',
      network: 'Нет соединения с сервером. Проверьте интернет и apiUrl',
      http: (status: number) => `Сервер ответил ошибкой (HTTP ${status}). Попробуйте позже`,
      unexpected: 'Неожиданный ответ сервера. Попробуйте позже',
      state: (state: string) => {
        switch (state) {
          case 'notAuthorized':
            return 'Инстанс не авторизован: привяжите аккаунт в личном кабинете GREEN-API';
          case 'blocked':
            return 'Аккаунт инстанса заблокирован';
          case 'starting':
            return 'Инстанс запускается. Попробуйте через пару минут';
          case 'sleepMode':
            return 'Инстанс в спящем режиме. Откройте мессенджер на телефоне';
          default:
            return `Инстанс недоступен (состояние: ${state})`;
        }
      },
    },
  },
  chats: {
    title: 'Чаты',
    empty: 'Здесь появятся ваши чаты',
    you: 'Вы: ',
    unread: (count: number) => `Непрочитанных: ${count}`,
  },
  newChat: {
    open: 'Новый чат',
    title: 'Новый чат',
    phone: 'Номер телефона',
    placeholder: '+7 999 123-45-67',
    hint: 'С кодом страны',
    submit: 'Начать чат',
    submitting: 'Ищем…',
    errors: {
      invalidPhone: 'Проверьте номер',
      notFound: 'Этот номер не зарегистрирован в мессенджере',
      notAuthorized: 'Инстанс не авторизован',
      quota: 'Лимит проверок номеров на тарифе исчерпан',
      tooManyRequests: 'Слишком много запросов. Попробуйте через минуту',
      network: 'Нет соединения с сервером',
      http: (status: number) => `Ошибка сервера (HTTP ${status})`,
      unexpected: 'Неожиданный ответ сервера',
    },
  },
  feed: {
    today: 'Сегодня',
    yesterday: 'Вчера',
    empty: 'Сообщений пока нет',
    messages: 'Сообщения',
    noChatSelected: 'Выберите чат, чтобы начать общение',
  },
} as const;
