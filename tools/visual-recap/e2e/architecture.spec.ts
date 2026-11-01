import {test,expect} from '@playwright/test'
test('selects graph node, shows evidence, zooms',async({page})=>{
 await page.goto('/?fixture=architecture')
 await page.getByRole('button',{name:'Architecture',exact:true}).click()
 await page.getByRole('button',{name:'Select component Number Formatter'}).click()
 await expect(page.getByRole('heading',{name:'Number Formatter'})).toBeVisible()
 await expect(page.getByText('Formats finite calculation results', {exact:false})).toBeVisible()
 await page.getByRole('button',{name:'Zoom in'}).click()
 await expect(page.locator('svg g[transform*="scale(1.2)"]')).toHaveCount(1)
})

test('keyboard users can pan the graph',async({page})=>{
 await page.goto('/?fixture=architecture')
 await page.getByRole('button',{name:'Architecture',exact:true}).click()
 const graph=page.locator('svg > g').first()
 await page.getByRole('button',{name:'Pan right'}).focus()
 await page.keyboard.press('Enter')
 await expect(graph).toHaveAttribute('transform',/translate\(70 0\)/)
 await page.getByRole('button',{name:'Pan down'}).click()
 await expect(graph).toHaveAttribute('transform',/translate\(70 70\)/)
})

test('graph controls remain visible inside a narrow viewport',async({page})=>{
 await page.setViewportSize({width:320,height:700})
 await page.goto('/?fixture=architecture')
 await page.getByRole('button',{name:'Architecture',exact:true}).click()
 const frame=page.getByLabel('Interactive architecture diagram')
 const toolbar=frame.locator('.graph-actions')
 await expect(page.getByRole('button',{name:'Zoom in'})).toBeVisible()
 await expect(page.getByRole('button',{name:'Zoom out'})).toBeVisible()
 const frameBox=await frame.boundingBox()
 const toolbarBox=await toolbar.boundingBox()
 expect(frameBox).not.toBeNull()
 expect(toolbarBox).not.toBeNull()
 expect(toolbarBox!.x).toBeGreaterThanOrEqual(frameBox!.x)
 expect(toolbarBox!.x+toolbarBox!.width).toBeLessThanOrEqual(frameBox!.x+frameBox!.width)
})

