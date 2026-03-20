import asynchandler from "../utils/asyncHandler.js";
import axios from "axios";


export const categorySorter = async(product : string)=>{

   const prompt = `Classify the product and tell which category it belongs to and only return the category name,    Categories:electronics, grocery, fashion, medicine       Product : ${product}     `
    
   const response = await axios.post("https://api.openai.com/v1/chat/completions",
    {
        model:"gpt-4o-mini",
        messages :[{
            role:"user",
            content : prompt
        }]
        
    },
    {
        headers :{
            Authorization:``
        }
    }
   )

   const productcategory = response.data.choices[0].message.content.trim().toLowerCase();
   return productcategory;
};