import {test,expect} from '@playwright/test'
test('renders grounded API and schema deltas',async({page})=>{
 await page.goto('/?fixture=ui')
 await page.getByRole('button',{name:'API / Schema'}).click()
 await expect(page.getByRole('heading',{name:'GET /calculator/status'})).toBeVisible()
})
test('never invents contract deltas for code-only PR',async({page})=>{
 await page.goto('/?fixture=code')
 await page.getByRole('button',{name:'API / Schema'}).click()
 await expect(page.getByText('No API or data contract changes')).toBeVisible()
})

