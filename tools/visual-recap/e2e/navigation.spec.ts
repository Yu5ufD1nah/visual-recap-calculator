import {test,expect} from '@playwright/test'
test('loads locally and filters changed-file paths',async({page})=>{
 await page.goto('/?fixture=architecture')
 await expect(page.getByRole('heading',{name:'Change impact, made visual.'})).toBeVisible()
 await page.getByRole('button',{name:'Files',exact:true}).click()
 await expect(page.getByRole('button',{name:'app/calculator.js',exact:true})).toBeVisible()
 await page.getByRole('searchbox',{name:'Search changed files'}).fill('format')
 await expect(page.getByRole('button',{name:'app/format.js',exact:true})).toBeVisible()
 await expect(page.getByRole('button',{name:'app/calculator.js',exact:true})).toHaveCount(0)
})

