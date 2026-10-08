import { describe, expect, it } from 'vitest';
import incomingText from './__fixtures__/incomingTextMessage.json';
import incomingLink from './__fixtures__/incomingTextWithLink.json';
import outgoing from './__fixtures__/outgoingMessage.json';
import { parseNotificationBody } from './notifications';

describe('parseNotificationBody', () => {
  it('parses an incoming text message (real Telegram payload)', () => {
    expect(parseNotificationBody(incomingText.body)).toEqual({
      kind: 'message',
      message: {
        direction: 'in',
        idMessage: '1791472792602',
        chatId: '10000000',
        peerName: 'Иван',
        text: 'Обычный текст!',
        timestamp: 1791472792000,
      },
    });
  });

  it('parses a link sent from Telegram as a plain textMessage', () => {
    const parsed = parseNotificationBody(incomingLink.body);
    expect(parsed).toMatchObject({
      kind: 'message',
      message: { text: 'Ссылка \nhttps://www.tutu.ru/' },
    });
  });

  it('takes the peer name from chatName for outgoing messages (senderName is us)', () => {
    expect(parseNotificationBody(outgoing.body)).toMatchObject({
      kind: 'message',
      message: { direction: 'out', chatId: '10000000', peerName: 'Иван' },
    });
  });

  it('parses extendedTextMessage (documented format, used by MAX)', () => {
    const body = {
      ...incomingText.body,
      messageData: {
        typeMessage: 'extendedTextMessage',
        extendedTextMessageData: { text: 'see https://example.com', description: '', title: '' },
      },
    };
    expect(parseNotificationBody(body)).toMatchObject({
      kind: 'message',
      message: { text: 'see https://example.com' },
    });
  });

  it('ignores notification types we do not handle', () => {
    for (const typeWebhook of [
      'outgoingAPIMessageReceived',
      'outgoingMessageStatus',
      'stateInstanceChanged',
    ]) {
      expect(parseNotificationBody({ typeWebhook })).toEqual({ kind: 'ignored', typeWebhook });
    }
  });

  it('ignores non-text messages', () => {
    const body = { ...incomingText.body, messageData: { typeMessage: 'imageMessage' } };
    expect(parseNotificationBody(body)).toEqual({
      kind: 'ignored',
      typeWebhook: 'incomingMessageReceived',
    });
  });

  it('ignores garbage bodies', () => {
    expect(parseNotificationBody(null)).toEqual({ kind: 'ignored', typeWebhook: undefined });
    expect(parseNotificationBody('oops')).toEqual({ kind: 'ignored', typeWebhook: undefined });
  });

  it('reports a handled type with a broken shape as invalid', () => {
    const body = {
      ...incomingText.body,
      messageData: { typeMessage: 'textMessage', textMessageData: {} },
    };
    expect(parseNotificationBody(body).kind).toBe('invalid');
  });
});
