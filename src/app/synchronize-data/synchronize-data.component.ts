import {Component, signal} from '@angular/core';
import { Peer } from "peerjs";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatButton, MatIconButton} from "@angular/material/button";
import {MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardTitle} from "@angular/material/card";
import {MatError, MatFormField, MatFormFieldModule, MatHint, MatLabel, MatPrefix} from "@angular/material/form-field";
import {MatInput, MatInputModule} from "@angular/material/input";
import {CdkCopyToClipboard} from "@angular/cdk/clipboard";
import {MatIconModule} from "@angular/material/icon";

/**
 * Component for data synchronization using PeerJS peer-to-peer connections.
 *
 * This component provides functionality for synchronizing training data between devices
 * using WebRTC peer-to-peer connections and allows users to:
 * - Generate and share peer connection IDs
 * - Connect to other devices for data synchronization
 * - Send and receive messages through peer connections
 * - Copy connection IDs to clipboard for easy sharing
 *
 * The component uses PeerJS library to establish direct connections between devices
 * without requiring a central server, enabling offline data synchronization.
 *
 * @route /synchronize
 */
@Component({
  selector: 'app-synchronize-data',
  standalone: true,
  imports: [
    FormsModule, MatFormFieldModule, MatInputModule, MatIconModule, MatCardActions,
    MatButton, CdkCopyToClipboard, MatCardContent, MatCardTitle, MatCardHeader, MatCard, MatIconButton
  ],
  templateUrl: './synchronize-data.component.html',
  styleUrl: './synchronize-data.component.scss'
})
export class SynchronizeDataComponent {
  connection: any;
  peer: any;

  peerId = signal<string>('');
  fPeerId = signal<string>('');

  msg = signal<string>('Message');
  messages = signal<string[]>([]);

  join() {
    this.peer = new Peer();
    console.log("Loading..")
    this.peer.on('open', (id: any) => {
      this.peerId.set(id);
      console.log('My peer ID is: ' + id);
    });

    this.peer.on('close', () => {
      this.peer = new Peer();
    });

    this.peer.on('connection', (c: any) => {
      this.connection = c;
      console.log("New connection : ")
      console.log(this.connection);

      this.fPeerId.set(c.peer);
      this.connection.on('open', () => {
        // Receive messages - receiver side
        this.connection.on('data', (data: any) => {
          console.log('Received', data);
          this.printMsg("Friend : " + data)
        });
      });
    });

    this.peer.on('disconnected', () => {
      console.log("disconnected")
      this.connection = null
    })
  }

  ngOnInit() {
  }

  connect() {
    console.log("connecting to " + this.fPeerId())
    this.connection = this.peer.connect(this.fPeerId());

    this.connection.on('open', () => {
      console.log("connected")
      // Receive messages - sender side
      this.connection.on('data', (data: any) => {
        console.log('Received', data);
        this.printMsg("Friend : " + data)
      });
    });

  }

  sendMessage() {
    console.log("sending message")
    // send message at sender or receiver side
    if (this.connection && this.connection.open) {
      this.printMsg("Me : " + this.msg())
      this.connection.send(this.msg());
    }
  }

  printMsg(msg: string) {
    const newMessages = [ ...this.messages(), msg ];
    this.messages.set(newMessages);
  }
}
