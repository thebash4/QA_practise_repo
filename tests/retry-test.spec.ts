import { test,  expect } from "@playwright/test";

test.describe('Retry demonstration', () => {

test.describe.configure({ retries: 1 });

test('fails first attempt and passes on retry', async ({}, testInfo) => {

  console.log('Attempt number:', testInfo.retry);

  expect(testInfo.retry).toBe(1);
});

});

test.describe('normal',()=>{

    test('always passes',async ({})=>{
expect (1+1).toBe(2);
    });
})
