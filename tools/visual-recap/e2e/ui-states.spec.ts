import {test,expect} from '@playwright/test'
test('labels inferred before/after states',async({page})=>{
 await page.goto('/?fixture=ui')
 await page.getByRole('button',{name:'UI states'}).click()
 await expect(page.getByText('Inferred from source code')).toBeVisible()
 await expect(page.getByText('01 · BEFORE')).toBeVisible()
 await expect(page.getByText('03 · AFTER')).toBeVisible()
})

