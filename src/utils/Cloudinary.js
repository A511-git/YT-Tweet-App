import cloudinary from "cloudinary";


cloudinary.config({ 
  cloud_name: 'my_cloud_name', 
  api_key: 'my_key', 
  api_secret: 'my_secret'
});


const cloudinaryConfig = ()=>{

}


export {cloudinaryConfig}