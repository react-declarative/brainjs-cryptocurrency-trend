import { Source } from 'react-declarative';

import Socket from 'sockjs-client';

import getTimeLabel from '../../utils/getTimeLabel';
import randomString from '../../utils/randomString';

import { CC_CANDLE_SOCKET } from '../../config/params';

import history from '../../history';

export const priceEmitter = Source.multicast(() => Source.create<number>((next) => {

    const socket = new Socket(CC_CANDLE_SOCKET);

    socket.onopen = () => {
        console.log(`candle socket opened ${getTimeLabel(new Date())}`);
        socket.send(randomString());
    };

    socket.onerror = (error) => {
        console.error(error);
        history.push('/error-page');
    };

    socket.onmessage = (msg) => {
        const price = parseFloat(msg.data);
        next(price);
    };

    socket.onclose = () => {
        console.log(`candle socket closed ${getTimeLabel(new Date())}`);
    };

    return () => socket.close();

}));

export default priceEmitter;
