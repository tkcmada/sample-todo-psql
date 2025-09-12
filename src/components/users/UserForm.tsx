"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { trpc } from "@/lib/trpc/client"
import { APPS_CONFIG, getAppNames, getAppRoles } from "@/lib/apps-config"

// Define form data type to match what we actually use in the form
type UserFormData = {
  user_id: string
  name: string
  email: string
  apps: string[]
  appRoles: { app_name: string; role: string }[]
}

// Create a form-specific schema that matches UserFormData exactly
const userFormSchema = z.object({
  user_id: z.string().min(1, 'User ID is required').max(256, 'User ID is too long'),
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  email: z.string().email('Invalid email format').max(255, 'Email is too long'),
  apps: z.array(z.string()),
  appRoles: z.array(z.object({
    app_name: z.string(),
    role: z.string(),
  })),
})

interface UserFormProps {
  initialData?: {
    user_id: string
    name: string
    email: string
    apps: string[]
    roles: string[]
  }
  mode: "create" | "edit"
}

export function UserForm({ initialData, mode }: UserFormProps) {
  const router = useRouter()
  const [selectedApps, setSelectedApps] = useState<Set<string>>(
    new Set(initialData?.apps || [])
  )
  
  // Parse existing roles into app-role format
  const existingAppRoles = initialData?.roles?.map(role => {
    const parts = role.split('-')
    if (parts.length >= 2) {
      const app = parts[0]
      const roleValue = parts.slice(1).join('-')
      return { app_name: app, role: roleValue }
    }
    return null
  }).filter((ar): ar is { app_name: string; role: string } => ar !== null) || []

  const [selectedAppRoles, setSelectedAppRoles] = useState<Set<string>>(
    new Set(existingAppRoles.map(ar => `${ar.app_name}-${ar.role}`))
  )

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    mode: "onChange",
    defaultValues: {
      user_id: initialData?.user_id || "",
      name: initialData?.name || "",
      email: initialData?.email || "",
      apps: Array.from(selectedApps),
      appRoles: existingAppRoles,
    },
  })

  const createMutation = trpc.user.create.useMutation({
    onSuccess: () => {
      router.push("/users")
    },
  })

  const updateMutation = trpc.user.update.useMutation({
    onSuccess: () => {
      router.push("/users")
    },
  })

  const utils = trpc.useContext()

  const onSubmit = async (data: UserFormData) => {
    try {
      if (mode === "create") {
        await createMutation.mutateAsync(data)
      } else if (initialData) {
        await updateMutation.mutateAsync(data)
      }
      // Invalidate users list
      await utils.user.getAll.invalidate()
    } catch (error) {
      console.error("Error saving user:", error)
    }
  }

  const handleAppToggle = (appName: string, checked: boolean) => {
    const newSelectedApps = new Set(selectedApps)
    const newSelectedAppRoles = new Set(selectedAppRoles)

    if (checked) {
      newSelectedApps.add(appName)
    } else {
      newSelectedApps.delete(appName)
      // Remove all roles for this app
      Array.from(newSelectedAppRoles).forEach(roleKey => {
        if (roleKey.startsWith(`${appName}-`)) {
          newSelectedAppRoles.delete(roleKey)
        }
      })
    }

    setSelectedApps(newSelectedApps)
    setSelectedAppRoles(newSelectedAppRoles)

    // Update form values
    form.setValue("apps", Array.from(newSelectedApps))
    form.setValue("appRoles", Array.from(newSelectedAppRoles).map(roleKey => {
      const [app, ...roleParts] = roleKey.split('-')
      return { app_name: app, role: roleParts.join('-') }
    }))
  }

  const handleAppRoleToggle = (appName: string, role: string, checked: boolean) => {
    const roleKey = `${appName}-${role}`
    const newSelectedAppRoles = new Set(selectedAppRoles)

    if (checked) {
      newSelectedAppRoles.add(roleKey)
    } else {
      newSelectedAppRoles.delete(roleKey)
    }

    setSelectedAppRoles(newSelectedAppRoles)

    // Update form values
    form.setValue("appRoles", Array.from(newSelectedAppRoles).map(roleKey => {
      const [app, ...roleParts] = roleKey.split('-')
      return { app_name: app, role: roleParts.join('-') }
    }))
  }

  const isLoading = createMutation.isLoading || updateMutation.isLoading

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {mode === "create" ? "Add User" : "Edit User"}
        </h1>
        <p className="text-muted-foreground">
          {mode === "create" 
            ? "Create a new user with apps and roles" 
            : "Update user information and permissions"
          }
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="user_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter unique user ID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter user name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Applications & Roles</Label>
              <p className="text-sm text-muted-foreground">
                Select applications and their associated roles for this user
              </p>
            </div>

            {getAppNames().map((appName) => {
              const appConfig = APPS_CONFIG[appName]
              const isAppSelected = selectedApps.has(appName)
              
              return (
                <div key={appName} className="border rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Checkbox
                      id={`app-${appName}`}
                      checked={isAppSelected}
                      onCheckedChange={(checked) => 
                        handleAppToggle(appName, checked as boolean)
                      }
                    />
                    <div className="flex-1">
                      <Label 
                        htmlFor={`app-${appName}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {appConfig.name}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {appConfig.description}
                      </p>
                    </div>
                  </div>

                  {isAppSelected && (
                    <div className="ml-6 space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Select Roles:
                      </Label>
                      <div className="grid grid-cols-1 gap-2">
                        {getAppRoles(appName).map((role) => {
                          const roleKey = `${appName}-${role}`
                          return (
                            <div key={role} className="flex items-center space-x-2">
                              <Checkbox
                                id={`role-${roleKey}`}
                                checked={selectedAppRoles.has(roleKey)}
                                onCheckedChange={(checked) => 
                                  handleAppRoleToggle(appName, role, checked as boolean)
                                }
                              />
                              <Label 
                                htmlFor={`role-${roleKey}`}
                                className="text-xs cursor-pointer"
                              >
                                {role}
                              </Label>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading 
                ? (mode === "create" ? "Creating..." : "Updating...") 
                : (mode === "create" ? "Create User" : "Update User")
              }
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.push("/users")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}