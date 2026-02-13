import { Add as AddIcon } from '@mui/icons-material'
import {
    Alert,
    Autocomplete,
    Box,
    Button,
    Card,
    CardActionArea,
    CardContent,
    Chip,
    CircularProgress,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from '@mui/material'
import { useState } from 'react'
import Markdown from 'react-markdown'

import { useAuth } from '~/lib/auth'
import {
    useCreateMessage,
    useDeleteMessage,
    useDivisions,
    useMarkMessageRead,
    useMessages,
    usePlayers,
} from '~/lib/react-query'
import type { MessageInput, Player } from '~/lib/types'

export default function MessageCenter() {
    const { data: messages, isLoading } = useMessages()
    const markRead = useMarkMessageRead()
    const deleteMessage = useDeleteMessage()
    const { user } = useAuth()
    const [expandedId, setExpandedId] = useState<number | null>(null)
    const [composeOpen, setComposeOpen] = useState(false)

    const handleToggle = (messageId: number, isRead: boolean) => {
        if (expandedId === messageId) {
            setExpandedId(null)
            return
        }
        setExpandedId(messageId)
        if (!isRead && user?.player_id) {
            markRead.mutate(messageId)
        }
    }

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
            </Box>
        )
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5">
                    {user?.is_admin ? 'Message Center' : 'Messages'}
                </Typography>
                {user?.is_admin && (
                    <Button
                        startIcon={<AddIcon />}
                        variant="contained"
                        onClick={() => setComposeOpen(true)}
                    >
                        Compose
                    </Button>
                )}
            </Box>

            {!messages?.length && (
                <Typography color="text.secondary">No messages yet.</Typography>
            )}

            {messages?.map((msg) => (
                <Card
                    key={msg.message_id}
                    sx={{
                        mb: 1,
                        border: msg.is_read ? undefined : '2px solid',
                        borderColor: msg.is_read ? undefined : 'primary.main',
                    }}
                >
                    <CardActionArea onClick={() => handleToggle(msg.message_id, msg.is_read)}>
                        <CardContent sx={{ pb: expandedId === msg.message_id ? 0 : undefined }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {!msg.is_read && (
                                    <Chip color="primary" label="New" size="small" />
                                )}
                                <Typography
                                    sx={{ fontWeight: msg.is_read ? 'normal' : 'bold', flexGrow: 1 }}
                                    variant="subtitle1"
                                >
                                    {msg.subject}
                                </Typography>
                                <Typography color="text.secondary" variant="caption">
                                    {new Date(msg.created_at).toLocaleDateString()}
                                </Typography>
                            </Box>
                        </CardContent>
                    </CardActionArea>
                    <Collapse in={expandedId === msg.message_id}>
                        <CardContent sx={{ pt: 0 }}>
                            <Box sx={{ '& p': { mt: 0 } }}>
                                <Markdown>{msg.body}</Markdown>
                            </Box>
                            {user?.is_admin && (
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                                    <Button
                                        color="error"
                                        size="small"
                                        onClick={() => deleteMessage.mutate(msg.message_id)}
                                    >
                                        Delete
                                    </Button>
                                </Box>
                            )}
                        </CardContent>
                    </Collapse>
                </Card>
            ))}

            <ComposeDialog open={composeOpen} onClose={() => setComposeOpen(false)} />
        </Box>
    )
}

function ComposeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [subject, setSubject] = useState('')
    const [body, setBody] = useState('')
    const [recipientType, setRecipientType] = useState<'player' | 'division' | 'league'>('league')
    const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([])
    const [selectedDivisionId, setSelectedDivisionId] = useState<number | ''>('')
    const [showPreview, setShowPreview] = useState(false)
    const [success, setSuccess] = useState(false)

    const { data: players } = usePlayers()
    const { data: divisions } = useDivisions()
    const createMessage = useCreateMessage()

    const resetForm = () => {
        setSubject('')
        setBody('')
        setRecipientType('league')
        setSelectedPlayers([])
        setSelectedDivisionId('')
        setShowPreview(false)
        setSuccess(false)
    }

    const handleClose = () => {
        resetForm()
        onClose()
    }

    const handleSend = () => {
        const data: MessageInput = {
            subject,
            body,
            recipient_type: recipientType,
        }

        if (recipientType === 'player') {
            data.player_ids = selectedPlayers.map((p) => p.player_id)
        } else if (recipientType === 'division') {
            data.recipient_id = selectedDivisionId as number
        }

        createMessage.mutate(data, {
            onSuccess: () => {
                setSuccess(true)
                setTimeout(() => {
                    handleClose()
                }, 1500)
            },
        })
    }

    const canSend =
        subject.trim() &&
        body.trim() &&
        (recipientType === 'league' ||
            (recipientType === 'player' && selectedPlayers.length > 0) ||
            (recipientType === 'division' && selectedDivisionId !== ''))

    return (
        <Dialog fullWidth maxWidth="sm" open={open} onClose={handleClose}>
            <DialogTitle>Compose Message</DialogTitle>
            <DialogContent>
                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        Message sent successfully!
                    </Alert>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <ToggleButtonGroup
                        exclusive
                        color="primary"
                        size="small"
                        value={recipientType}
                        onChange={(_, val) => val && setRecipientType(val)}
                    >
                        <ToggleButton value="league">Everyone</ToggleButton>
                        <ToggleButton value="division">Division</ToggleButton>
                        <ToggleButton value="player">Specific Players</ToggleButton>
                    </ToggleButtonGroup>

                    {recipientType === 'player' && (
                        <Autocomplete
                            multiple
                            getOptionLabel={(p) => `${p.first_name} ${p.last_name}`}
                            options={players ?? []}
                            renderInput={(params) => (
                                <TextField {...params} label="Select Players" />
                            )}
                            value={selectedPlayers}
                            onChange={(_, val) => setSelectedPlayers(val)}
                        />
                    )}

                    {recipientType === 'division' && (
                        <FormControl>
                            <InputLabel>Division</InputLabel>
                            <Select
                                label="Division"
                                value={selectedDivisionId}
                                onChange={(e) => setSelectedDivisionId(e.target.value as number)}
                            >
                                {divisions?.map((d) => (
                                    <MenuItem key={d.division_id} value={d.division_id}>
                                        {d.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    <TextField
                        label="Subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                    />

                    <TextField
                        label="Body (Markdown)"
                        minRows={6}
                        multiline
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                    />

                    <Button
                        size="small"
                        variant="text"
                        onClick={() => setShowPreview(!showPreview)}
                    >
                        {showPreview ? 'Hide Preview' : 'Show Preview'}
                    </Button>

                    {showPreview && (
                        <Card variant="outlined">
                            <CardContent>
                                <Typography gutterBottom variant="subtitle2">
                                    Preview
                                </Typography>
                                <Markdown>{body}</Markdown>
                            </CardContent>
                        </Card>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button
                    disabled={!canSend || createMessage.isPending}
                    variant="contained"
                    onClick={handleSend}
                >
                    {createMessage.isPending ? 'Sending...' : 'Send'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
