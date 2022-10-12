import { useState } from 'react';
import {
  Center,
  Stack,
  HStack,
  Box,
  Button,
  PinInput,
  PinInputField,
  Heading,
} from '@chakra-ui/react';
import axios from 'axios';

export default function Home() {
  const [joinCode, setJoinCode] = useState();
  const [joinButtonLoading, setJoinButtonLoading] = useState(false);
  const [createButtonLoading, setCreateButtonLoading] = useState(false);
  const [joinButtonDisabled, setJoinButtonDisabled] = useState(true);
  const changeJoinCode = (value) => {
    setJoinCode(value);
    setJoinButtonDisabled(value.length !== 6);
  }
  const joinSession = () => {
    setJoinButtonLoading(true);
    return window.location.href = `/s/${joinCode}`;
  }
  const createSession =  () => {
    setCreateButtonLoading(true);
    axios.get('https://api.compare.tmg.sh/sessions/create').then((response) => {
      return window.location.href = `/s/${response.data.session.id}`;
    });
  }

  return (
    <>
      <Center my={75} h={40}>
        <Box bg="gray.700" rounded="lg" boxShadow="xl" py={5} px={125}>
          <Stack spacing={3}>
            <Heading>Join/Create</Heading>
            <HStack>
              <PinInput onChange={changeJoinCode} autoFocus={true}>
                <PinInputField />
                <PinInputField />
                <PinInputField />
                <PinInputField />
                <PinInputField />
                <PinInputField />
              </PinInput>
            </HStack>
            <HStack spacing={3}>
              <Button isDisabled={joinButtonDisabled} isLoading={joinButtonLoading} onClick={joinSession}>Join</Button>
              <Button onClick={createSession} isLoading={createButtonLoading} variant="outline">Create</Button>
            </HStack>
          </Stack>
        </Box>
      </Center>
    </>
  )
}