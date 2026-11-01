import {test,expect} from '@playwright/test'
test('real browser preview renders graph',async({page})=>{
 await page.goto('/')
 await page.getByRole('button',{name:'Architecture',exact:true}).click()
 await expect(page.locator('svg .graph-node').first()).toBeVisible()
 await expect(page.getByRole('button',{name:'Toggle light/dark theme'})).toBeVisible()
})

