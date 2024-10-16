  /* eslint-disable @typescript-eslint/no-unused-vars */
  /* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { aspectRatioOptions, creditFee, defaultValues, transformationTypes } from "@/constants"
import { CustomField } from "./CustomField"
import { useEffect, useState, useTransition } from "react"
import { AspectRatioKey, debounce, deepMergeObjects } from "@/lib/utils"
import MediaUploader from "./MediaUploader"
import TransformedImage from "./TransformedImage"
import { updateCredits } from "@/lib/actions/user.actions"
import { getCldImageUrl } from "next-cloudinary"
import { addImage, updateImage } from "@/lib/actions/image.actions"
import { useRouter } from "next/navigation"
import { InsufficientCreditsModal } from "./InsufficientCreditsModal"

export const formSchema = z.object({
  title: z.string(),
  aspectRatio: z.string().optional(),
  color: z.string().optional(),
  prompt: z.string().optional(),
  publicId: z.string(),
})

const TransformationForm = ({ action, data = null,userId,type,creditBalance,config=null}: TransformationFormProps) => {
   const transformationType =transformationTypes[type];
   
   const [image, setImage] = useState(data)

   const [newTransformation, setnewTransformation] = useState<Transformations|null >(null)

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const [transformationConfig, setTransformationConfig] = useState(config);
  const [isPending,startTransition]=useTransition();
  const router =useRouter();

  const initalValues = data && action === 'Update' ? {
    title: data?.title,
    aspectRatio: data?.aspectRatio,
    color: data?.color,
    prompt: data?.prompt,
    publicId: data?.publicId,
  } : defaultValues

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initalValues,
  })

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    setIsSubmitting(true);
    if(data || image){
      const transformationUrl=getCldImageUrl({
        width:image?.width,
        height:image?.height,
        src:image?.publicId,
        ...transformationConfig
      })

      const imageData={
        title:values.title,
        publicId:image?.publicId,
        transformationType:type,
        width:image?.width,
        height:image?.height,
        config: transformationConfig,
        secureURL:image?.secureURL,
        transformationURL:transformationUrl,
        aspectRatio:values.aspectRatio,
        prompt:values.prompt,
        color:values.color,
      }
        if(action === 'Add'){
          try {
            console.log('Calling addImage function');
            const newImage=await addImage({
              image:imageData,
              userId,
              path:'/',
            })
            console.log('New image response:', newImage);
            
            if(newImage){
              form.reset()
              setImage(data);
              router.push(`/transformations/${newImage._id}`)
  
            }
          } catch (error) {
            console.log(error);
          }
        }
        if(action ==='Update'){
          try {
            const updatedImage=await updateImage({
              image:{
                ...imageData,
                _id:data._id,
              },
              userId,
              path:`/transformations/${data._id}`,
            })
            if(updatedImage){
              router.push(`/transformations/${updatedImage._id}`)
  
            }
          }catch(error){
            console.log(error)
          }
        }
      }
    setIsSubmitting(false);
  }

  const onSelectFieldHandler=(value: string,onChangeField: (value: string) => void)=>{
  const imageSize=aspectRatioOptions[value as AspectRatioKey] 

  setImage((prevState:any)=>({
    ...prevState,
    aspectRation:imageSize.aspectRatio,
    width:imageSize.width,
    height:imageSize.height,
  }))
  setnewTransformation(transformationType.config);

  return onChangeField(value)
}
  
  const onInputChangeHandler =(fieldName: string,value: string,type:string,onChangeField: (value: string) => void)=>{
        debounce(()=>{
          setnewTransformation((prevState:any)=>({
            ...prevState,
            [type]:{
              ...prevState?.[type],
              [fieldName ==='prompt'?'prompt':'to']:
              value
            }
          }))
          
        },1000)();
        return onChangeField(value);
  }
  //TODO:Update credit fee to something
  const onTransformHandler = async()=>{
   setIsTransforming(true);
   
   setTransformationConfig(
    deepMergeObjects(newTransformation ??{},
      transformationConfig)
    )

    setnewTransformation(null)
   startTransition(async()=>{
     await updateCredits(userId,creditFee)
   })
  }
  useEffect(()=>{
    if(image && (type==='restore' || type ==='removeBackground')){
      setnewTransformation(transformationType.config)
    }
  },[image,transformationType.config,type])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {creditBalance <Math.abs(creditFee) && <InsufficientCreditsModal/>}
        <CustomField
          control={form.control}
          name="title"
          formLabel="Image Title"
          className="w-full"
          render={({ field }) => <Input {...field} className="input-field" />}
        />
        {type === 'fill' && (
          <CustomField
           control={form.control}
           name="aspectRatio"
           formLabel="aspectRatio"
           className="w-full"
            render={({ field }) => (
              <Select
              onValueChange={(value)=>onSelectFieldHandler(value,field.onChange)}
              >
                <SelectTrigger className="select-field">
                  <SelectValue placeholder="Select Size" />
                </SelectTrigger>
                <SelectContent>
                 {Object.keys(aspectRatioOptions).map((key)=>(
                  <SelectItem key={key} value={key} className="select-item">
                      {aspectRatioOptions[key as AspectRatioKey].label}
                  </SelectItem>
                 ))}
                </SelectContent>
              </Select>
        )}
        />
        )}
        {(type ==='remove' || type==='recolor') &&(
          <div className="prompt-field">
            <CustomField
            control={form.control}
            name="prompt"
            formLabel={
              type ==='remove'?'object to remove ':'object to recolor'
            }
            className="w-full"
            render={({ field }) => <Input 
            {...field}
             className="input-field" 
             onChange={(e)=>onInputChangeHandler(
              'prompt',
              e.target.value,
              type,
              field.onChange
             )}
             value={field.value}
             />}
            />
            {type ==='recolor' && (
            <CustomField
           control ={form.control}
           name="color"
           formLabel="Replacement Color"
           className="w-full"
           render={({field})=>(
            <Input 
            {...field}
             className="input-field" 
             onChange={(e)=>onInputChangeHandler(
              'color',
              e.target.value,
              'recolor',
              field.onChange
             )}
             value={field.value}
            />
           )}
            />
            )}
          </div>
        )}
      
        <div className="media-uploader-field">
        <CustomField 
        control={form.control}
        name="publicId"
        className="flex size-full flex-col"
        render={({field})=>(
       <MediaUploader 
       onValueChange={field.onChange}
       setImage={setImage}
       publicId={field.value}
       image={image}
       type={type}
       />
       
        )}
        
        />
        <TransformedImage
        image={image}
        type={type}
        title={form.getValues().title}
        isTransforming={isTransforming}
        setIsTransforming={setIsTransforming}
        transformationConfig={transformationConfig}
        />
        </div>


      <div className="flex flex-col gap-4">
      <Button 
      type="button"
      className="submit-button capitalize"
      disabled={isTransforming || newTransformation === null}
      onClick={onTransformHandler}
      >
        {isTransforming ?'Transforming...':'Apply transformation'}
      </Button>
      
      <Button
      type="submit"
      className="submit-button capitalize"
      disabled={isSubmitting}
      >
      {isSubmitting ?'Submitting...':'Save image'}

      </Button>
      </div>
      </form>
    </Form>
  )
}

export default TransformationForm