"use client";

import { Check, ChevronsUpDown, Plus } from "lucide-react";
import * as React from "react";
import { ClientCreationModal } from "~/components/clients/client-creation-modal";
import { Button } from "~/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "~/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "~/components/ui/popover";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

interface ClientDropdownProps {
	value: string;
	onChange: (value: string) => void;
}

export function ClientDropdown({ value, onChange }: ClientDropdownProps) {
	const [open, setOpen] = React.useState(false);
	const [modalOpen, setModalOpen] = React.useState(false);

	// Fetch companies
	const { data: companies, refetch } = api.crm.getCompanies.useQuery();

	const selectedCompany = companies?.find((company) => company.id === value);

	const handleClientCreated = async (newClientId: string) => {
		await refetch();
		onChange(newClientId);
		setModalOpen(false);
		setOpen(false);
	};

	return (
		<>
			<Popover onOpenChange={setOpen} open={open}>
				<PopoverTrigger asChild>
					<Button
						aria-expanded={open}
						className="w-full justify-between"
						role="combobox"
						variant="outline"
					>
						{selectedCompany ? selectedCompany.name : "Select client..."}
						<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent align="start" className="w-full p-0">
					<Command>
						<CommandInput placeholder="Search client..." />
						<CommandList>
							<CommandEmpty>No client found.</CommandEmpty>
							<CommandGroup>
								{companies?.map((company) => (
									<CommandItem
										key={company.id}
										onSelect={() => {
											onChange(company.id);
											setOpen(false);
										}}
										value={company.name}
									>
										<Check
											className={cn(
												"mr-2 h-4 w-4",
												value === company.id ? "opacity-100" : "opacity-0",
											)}
										/>
										{company.name}
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>

						{/* Create New Client Option */}
						<div className="border-t p-1">
							<Button
								className="w-full justify-start text-blue-600 hover:bg-blue-50 hover:text-blue-700"
								onClick={(e) => {
									e.preventDefault();
									setOpen(false);
									setModalOpen(true);
								}}
								variant="ghost"
							>
								<Plus className="mr-2 h-4 w-4" />
								Create New Client
							</Button>
						</div>
					</Command>
				</PopoverContent>
			</Popover>

			{modalOpen && (
				<ClientCreationModal
					onOpenChange={setModalOpen}
					onSuccess={handleClientCreated}
					open={modalOpen}
				/>
			)}
		</>
	);
}
