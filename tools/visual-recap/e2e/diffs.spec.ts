import {test,expect} from '@playwright/test'
test('shows before/after annotated key changes',async({page})=>{
 await page.goto('/?fixture=architecture')
 await page.getByRole('button',{name:'Key changes',exact:true}).click()
 await expect(page.getByRole('tabpanel')).toContainText('Before')
 await expect(page.getByRole('tabpanel')).toContainText('After')
 await page.getByRole('tab',{name:'format.js'}).click()
 await expect(page.getByText('Contract now encodes', {exact:false})).toBeVisible()
})

test('keyboard arrows advance through three tabs while moving focus',async({page})=>{
 await page.goto('/?fixture=architecture')
 await page.getByRole('button',{name:'Key changes',exact:true}).click()
 const tabs=page.getByRole('tab')
 await tabs.first().focus()
 await page.keyboard.press('ArrowRight')
 await expect(tabs.nth(1)).toBeFocused()
 await page.keyboard.press('ArrowRight')
 await expect(tabs.nth(2)).toBeFocused()
 await expect(tabs.nth(2)).toHaveAttribute('aria-selected','true')
})
test('selecting a changed file opens that file, not the first diff',async({page})=>{
 await page.goto('/?fixture=architecture')
 await page.getByRole('button',{name:'Files',exact:true}).click()
 await page.getByRole('button',{name:'app/format.js',exact:true}).click()
 await expect(page.getByRole('heading',{name:'Explicit decimal precision'})).toBeVisible()
})

