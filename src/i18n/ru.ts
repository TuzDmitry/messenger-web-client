export const ru = {
  nav: {
    chats: 'Чаты',
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
            return 'Инстанс не авторизован: привяжите аккаунт в личном кабинете GREEN-API'
          case 'blocked':
            return 'Аккаунт инстанса заблокирован'
          case 'starting':
            return 'Инстанс запускается. Попробуйте через пару минут'
          case 'sleepMode':
            return 'Инстанс в спящем режиме. Откройте мессенджер на телефоне'
          default:
            return `Инстанс недоступен (состояние: ${state})`
        }
      },
    },
  },
  chats: {
    title: 'Чаты',
    empty: 'Здесь появятся ваши чаты',
  },
  feed: {
    noChatSelected: 'Выберите чат, чтобы начать общение',
  },
} as const
