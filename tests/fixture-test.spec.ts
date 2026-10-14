import { test, expect } from '../fixtures/simple-fixture';

test('calling a fixture test', async({greeting})=>{
expect(greeting).toBe("hello");
console.log(greeting);
})