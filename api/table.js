/* Return the entries of a table in Notion */

require('dotenv').config()
// const call = require("../notion/call")
const normalizeId = require("../notion/normalizeId")
// const textArrayToHtml = require("../notion/textArrayToHtml.js")
// const getAssetUrl = require("../notion/getAssetUrl")
const { Client } = require('@notionhq/client')

const notion = new Client({
  auth: process.env.NOTION_SECRET,
})

module.exports = async (req, res) => {
  const { id: queryId, sort } = req.query
  const id = normalizeId(queryId)

  if (!id) {
    return res.json({
      error: "no Notion doc ID provided as `id` parameter"
    })
  }

  let response = {}

  try {
    response = await notion.databases.query({
      database_id: id,
      sorts: [
        {
          property: sort || 'Order',
          direction: 'ascending',
        },
      ],
    })
  } catch (error) {
    try {
      response = await notion.databases.query({
        database_id: id,
      })
    } catch (error) {
      return res.json(error)
    }
  }

  response.results.map((row) => {
    row.fields = {}
    for (const [k, v] of Object.entries(row.properties)) {
      // console.log(`${k}: ${v}`);
      // console.log(v)
      if (v.type === 'title') {
        // console.log(`${k}:${v.title[0]?.plain_text}`)
        row.fields[k] = v.title[0]?.plain_text || undefined
      }
      if (v.type === 'rich_text') {
        // console.log(`${k}:${v.rich_text[0]?.plain_text}`)
        row.fields[k] = v.rich_text[0]?.plain_text
      }
      if (v.type === 'number') {
        // console.log(`${k}:${v.number}`)
        row.fields[k] = v.number
      }
      if (v.type === 'checkbox') {
        // console.log(`${k}:${v.checkbox}`)
        row.fields[k] = v.checkbox
      }
      if (v.type === 'url') {
        // console.log(`${k}:${v.url}`)
        row.fields[k] = v.url
      }
      if (v.type === 'select') {
        // console.log(`${k}:${v.select?.name}`)
        row.fields[k] = v.select?.name
      }
      if (v.type === 'files') {
        // console.log(`${k}:${v.select?.name}`)
        row.fields[k] = v.files[0]?.external?.url || v.files[0]?.file?.url
      }
      if (v.type === 'relation') {
        // console.log(`${k}:`)
        // console.log(v)
        // pageID relation
        row.fields[k] = v?.relation[0]?.id?.replace(/-/g, '')
        // console.log(row.fields[k])
      }
    }
    // DEV_MODE: comment for debug
    delete row.properties
  })

  const output = response.results

  // const pageData = await call("getRecordValues", {
  //   requests: [
  //     {
  //       id: id,
  //       table: "block"
  //     }
  //   ]
  // })

  // console.log('pageData', pageData)

  // if(!pageData.results[0].value) {
  //   return res.json({
  //     error: "invalid Notion doc ID, or public access is not enabled on this doc"
  //   })
  // }

  // if(!pageData.results[0].value.type.startsWith("collection_view")) {
  //   return res.json({
  //     error: "this Notion doc is not a collection"
  //   })
  // }

  // const collectionId = pageData.results[0].value.collection_id
  // const collectionViewId = pageData.results[0].value.view_ids[0]


  // const tableData = await call("queryCollection", {
  //   collectionId,
  //   collectionViewId,
  //   query: {},
  //   loader: { "type": "reducer", "reducers": { "collection_group_results": { "type": "results", "limit": 99999 } }, "userTimeZone": "UTC" }
  // })

  // const subPages = tableData.result.reducerResults.collection_group_results.blockIds

  // const schema = tableData.recordMap.collection[collectionId].value.schema

  // const output = []

  // subPages.forEach(id => {
  //   const page = tableData.recordMap.block[id]

  //   const fields = {}

  //   for(const s in schema) {
  //     const schemaDefinition = schema[s]
  //     const type = schemaDefinition.type
  //     let value = page.value.properties && page.value.properties[s] && page.value.properties[s][0][0]

  //     if(type === "checkbox") {
  //       value = value === "Yes" ? true : false
  //     } else if(value && type === "date") {
  //       try {
  //         value = page.value.properties[s][0][1][0][1]
  //       } catch {
  //         // it seems the older Notion date format is [[ string ]]
  //         value = page.value.properties[s][0][0]
  //       }
  //     } else if(value && type === "text") {
  //       value = textArrayToHtml(page.value.properties[s])
  //     } else if(value && type === "file") {
  //       const files = page.value.properties[s].filter(f => f.length > 1)
  //       // some items in the files array are for some reason just [","]

  //       const outputFiles = []

  //       files.forEach(file => {
  //         const s3Url = file[1][0][1]
  //         outputFiles.push(getAssetUrl(s3Url, page.value.id))
  //       })

  //       value = outputFiles
  //     } else if(value && type === "multi_select") {
  //       value = value.split(",")
  //     }

  //     fields[schemaDefinition.name] = value || undefined
  //   }

  //   output.push({
  //     fields,
  //     id: page.value.id,
  //     emoji: page.value.format && page.value.format.page_icon,
  //     created: page.value.created_time,
  //     last_edited: page.value.last_edited_time
  //   })
  // })


  return res.json(output)
}
