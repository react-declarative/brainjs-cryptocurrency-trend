import { Source, compose, fetchApi } from 'react-declarative';

import history from '../../history';

export const priceEmitter = Source.multicast(() => Source.create<number>((next) => {

    let disposeRef: Function = () => undefined;

    const process = async () => {

        let intervalRef: Function = () => undefined;

        const {
            data: {
                instanceServers = [],
                token = ""
            },
        } = await fetchApi("https://api.kucoin.com/api/v1/bullet-public", {
            method: "POST",
        });

        const server = instanceServers.find((server: any) => server.protocol = "websocket");
        const wsurl = new URL("endpoint", server.endpoint);
        wsurl.searchParams.set("token", token);

        const ws = new WebSocket(wsurl);

        ws.addEventListener('open', () => {
            ws.send(JSON.stringify({
                "id": Date.now(),
                "type": "subscribe",
                "topic": "/market/ticker:ETH-USDT",
                "privateChannel": false,
                "response": false,
            }));
            intervalRef = Source.fromInterval(1_000).connect(() => {
                if (ws.readyState === ws.OPEN) {
                    ws.send(JSON.stringify({
                        "id": Date.now(),
                        "type": "ping",
                    }));
                } else if (ws.readyState === ws.CLOSED) {
                    intervalRef();
                    history.push("/error-page");
                }
            });
        });

        ws.addEventListener('message', (msg) => {
            const data = JSON.parse(msg.data);
            if (data.type === "message" && data.topic === "/market/ticker:ETH-USDT") {
                next(parseFloat(data.data.price));
            }
        });

        disposeRef = compose(
            () => ws.close(),
            () => intervalRef(),
        );
    };

    process();

    return () => disposeRef();

}));

export default priceEmitter;
