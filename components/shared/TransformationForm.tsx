"use client"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
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
import { title } from "process"
import { defaultValues } from "@/constants"

const formSchema = z.object({
  title: z.string(),
  aspectRatio:z.string().optional(),
  username: z.string().min(2).max(50),
  color: z.string().optional(),
  prompt: z.string().optional(),
  publicId:z.string(),
})

const TransformationForm = ({action, data =null}:TransformationFormProps) => {
    const initalValues =data && action === 'Update'?{
    title:data?.title,
    aspectRatio:data?.aspectRatio,
    color:data?.color,
    prompt:data?.prompt,
    publicId:data?.publicId,
    }: defaultValues

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
          username: "",
        },
      })
     
      // 2. Define a submit handler.
      function onSubmit(values: z.infer<typeof formSchema>) {
        // Do something with the form values.
        // ✅ This will be type-safe and validated.
        console.log(values)
      }
   


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="shadcn" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}

export default TransformationForm