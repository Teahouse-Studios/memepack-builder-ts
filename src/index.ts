/**
 * @name memepack-builder
 * @description A resourcepack builder using ts
 *
 * @author MysticNebula70
 * @license Apache-2.0
 */

// name
export const name = 'memepack-builder'
export const BASE_LANGUAGE_FILE = 'assets/minecraft/lang/zh_meme.json'
export { BedrockBuilder, JavaBuilder } from './PackBuilder'
export { ModuleParser } from './module'
export { Logger } from './log'
