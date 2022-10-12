import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { io } from 'socket.io-client';
import { MD5 } from 'crypto-js';
import { InfoIcon } from '@chakra-ui/icons';
import {
  Center,
  Box,
  Spinner,
  HStack,
  Stack,
  Heading,
  Input,
  InputGroup,
  InputRightElement,
  Button,
  Text,
  Tooltip,
  Icon,
  Progress,
} from '@chakra-ui/react';

export default function Session() {
  const router = useRouter();
  const [stage, setStage] = useState(
    <>
      <Spinner color="gray" />
    </>
  )
  let submitText = '';

  const isFirstRun = useRef(true);
  useEffect(() => {
    if(isFirstRun.current) return isFirstRun.current = false;
    const { id } = router.query;
    const socket = io('https://api.compare.tmg.sh');
    socket.emit('join', { sessionId: id });
    socket.on('joined', () => {
      const copyButton = () => {
        const shareURL = `https://compare.tmg.sh/s/${id}`;
        navigator.clipboard.writeText(shareURL);
      }
      setStage(
        <>
          <Stack spacing={3}>
            <Center>
              <HStack spacing={3}>
                <Spinner color="gray" />
                <Text fontSize="md" color="gray">Waiting for other user...</Text>
              </HStack>
            </Center>
            <InputGroup size="md">
              <Input
                pr="7.5rem"
                disabled={true}
                defaultValue={id}
              />
              <InputRightElement width="5.5rem">
                <Button mr={6.5} h="1.75rem" size="sm" onClick={copyButton}>
                  Copy Link
                </Button>
              </InputRightElement>
            </InputGroup>
          </Stack>
        </>
      );
    });
    const submitButton = () => {
      socket.emit('submit', { sessionId: id, msg: MD5(submitText.toLowerCase()).toString() });
      setStage(
        <>
          <HStack spacing={3}>
            <Spinner color="gray" />
            <Text fontSize="md" color="gray">Waiting for other response...</Text>
          </HStack>
        </>
      );
    }
    socket.on('ready', () => {
      setStage(
        <>
          <Stack spacing={3}>
            <Heading>Submit Here</Heading>
            <Input isRequired={true} onChange={(e) => submitText = e.target.value} width={400} placeholder="Encrypted with AES once submitted." />
            <Button onClick={submitButton}>Submit</Button>
          </Stack>
        </>
      );
    });
    socket.on('done', (data) => {
      const revealTimeLeft = 3;
      const revealCountdown = () => {
        let newStage;
        if(revealTimeLeft > 0) {
          setTimeout(revealCountdown, 1000);
          newStage = <>
            <Heading>{revealTimeLeft}</Heading>
          </>;
          revealTimeLeft -= 1;
          setStage(newStage);
        } else {
          if(data.result === true) {
            setStage(
              <>
                <HStack spacing={3}>
                  <Icon viewBox="0 0 20 20" fill="currentColor" color="#68D391">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </Icon>
                  <Text fontSize="md" color="gray">The texts submitted are the same.</Text>
                </HStack>
              </>
            )
          } else {
            setStage(
              <>
                <HStack spacing={3}>
                  <Icon viewBox="0 0 20 20" fill="currentColor" color="#FC8181">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </Icon>
                  <Text fontSize="md" color="gray">The texts submitted are not the same.</Text>
                </HStack>
              </>
            )
          }
        }
      }
      setTimeout(revealCountdown, 1000);
    });
    socket.on('goaway', () => {
      alert('The other user has left the session. You will now be redirected.');
      return window.location.href = '/';
    });
    socket.on('error', (data) => {
      alert('This session does not exist! Please double check the code.');
      return window.location.href = '/';
    });
  }, [router.query]);

  return (
    <>
      <Center my={75} h={40}>
        <Box bg="gray.700" rounded="lg" boxShadow="xl" py={5} px={125}>
          {stage}
        </Box>
      </Center>
    </>
  )
}
