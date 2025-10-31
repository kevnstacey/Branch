declare module '@testsprite/testsprite' {
  interface Page {
    goto(url: string): Promise<void>;
    locator(selector: string): {
      toBeVisible(): Promise<void>;
      // Add other common locator methods if needed
    };
  }

  interface TestContext {
    page: Page;
  }

  type TestFunction = (name: string, callback: (context: TestContext) => Promise<void>) => void;
  type ExpectFunction = (locator: any) => any; // Simplified for now

  export const test: TestFunction;
  export const expect: ExpectFunction;
}