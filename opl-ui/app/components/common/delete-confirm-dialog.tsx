import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from '@mui/material'

interface DeleteConfirmDialogProps {
    open: boolean
    title: string
    description: string
    isPending: boolean
    onConfirm: () => void
    onClose: () => void
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
    open,
    title,
    description,
    isPending,
    onConfirm,
    onClose,
}) => (
    <Dialog open={open} onClose={onClose}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
            <DialogContentText>{description}</DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button disabled={isPending} onClick={onClose}>
                Cancel
            </Button>
            <Button color="error" disabled={isPending} variant="contained" onClick={onConfirm}>
                {isPending ? 'Deleting...' : 'Delete'}
            </Button>
        </DialogActions>
    </Dialog>
)
