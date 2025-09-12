"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Edit, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { trpc } from "@/lib/trpc/client"
import type { UserWithAppsAndRoles } from "@/lib/types"

export const columns: ColumnDef<UserWithAppsAndRoles>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          User ID
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue("id")}</div>,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Username
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="lowercase">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "Apps",
    header: "Apps",
    cell: ({ row }) => {
      const apps = row.getValue("Apps") as string[]
      return (
        <div className="flex flex-wrap gap-1">
          {apps.map((app, index) => (
            <span
              key={index}
              className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
            >
              {app}
            </span>
          ))}
        </div>
      )
    },
  },
  {
    accessorKey: "AppRoles",
    header: "Roles",
    cell: ({ row }) => {
      const roles = row.getValue("AppRoles") as string[]
      return (
        <div className="flex flex-wrap gap-1">
          {roles.map((role, index) => (
            <span
              key={index}
              className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-700/10"
            >
              {role}
            </span>
          ))}
        </div>
      )
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const user = row.original
      
      return <UserActions user={user} />
    },
  },
]

function UserActions({ user }: { user: UserWithAppsAndRoles }) {
  const router = useRouter()
  const utils = trpc.useContext()
  
  const deleteMutation = trpc.user.delete.useMutation({
    onSuccess: () => {
      utils.user.getAll.invalidate()
    },
  })

  const handleEdit = () => {
    router.push(`/users/edit/${user.id}`)
  }

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteMutation.mutateAsync({ id: user.id })
      } catch (error) {
        console.error("Error deleting user:", error)
      }
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleEdit}
      >
        <Edit className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDelete}
        disabled={deleteMutation.isLoading}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}