/// <reference types="jest" />
import Element from './element';
export declare class TestWorld {
    $server: import("msw/lib/types/node").SetupServerApi;
    $spy: jest.Mock<any, any>;
    email: Element;
    extraEmails: Element;
    firstName: Element;
    lastName: Element;
    password: Element;
    reset: Element;
    submit: Element;
    successAlert: Element;
    showExtraEmailsAlert: Element;
}
