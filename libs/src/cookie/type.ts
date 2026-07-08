import {
  ClearCookieOptions,
  DeleteCookieOptions,
  SetCookieOptions,
} from '@capacitor/core';

export interface CookieUrlOptionsType {
  url?: string;
}

export interface CookieMapType {
  [key: string]: string;
}

export interface SetCookieOptionsType extends SetCookieOptions {}

export interface DeleteCookieOptionsType extends DeleteCookieOptions {}

export interface ClearCookieOptionsType extends ClearCookieOptions {}
