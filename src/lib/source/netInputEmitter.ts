import { Source } from 'react-declarative';

import priceEmitter from "./priceEmitter";

import { CC_INPUT_SIZE } from '../../config/params';

export const netInputEmitter = Source.unicast(() => priceEmitter
    .reduce<number[]>((acm, cur) => {
        if (acm.length === CC_INPUT_SIZE) {
            return [cur];
        } else {
            return [...acm, cur];
        }
    }, [])
    .filter((acm) => acm.length === CC_INPUT_SIZE)
);

export default netInputEmitter;
