import { customAlphabet, nanoid } from 'nanoid';
import {numbers} from 'nanoid-dictionary';

export function generateAccountUID() {
    const generate10UniqueNumbers = customAlphabet(numbers, 10);

    const uniqueId = generate10UniqueNumbers()
    return uniqueId;
}

export function generateUID() {
    return nanoid(10);
}