/**
 * @name memepack-builder
 * @description A resourcepack builder using ts
 * 
 * @author MysticNebula70
 * @license Apache-2.0
 */

import { resolve } from 'path';
import { bedrockBuilder } from './builder/bedrockBuilder';
import { javaBuilder } from './builder/javaBuilder';
import { moduleChecker } from './moduleChecker/base';
import * as types from './types';

// name
export const name = 'memepack-builder';
export { bedrockBuilder } from './builder/bedrockBuilder';
export { javaBuilder } from './builder/javaBuilder';
export { moduleChecker } from './moduleChecker/base';