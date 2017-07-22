import React, { Component } from 'react'
import { autobind } from 'core-decorators'

const BrowserSpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition ||
  window.mozSpeechRecognition ||
  window.msSpeechRecognition ||
  window.oSpeechRecognition
const recognition = BrowserSpeechRecognition
  ? new BrowserSpeechRecognition()
  : null

export default function SpeechRecognition(WrappedComponent) {
  return class SpeechRecognitionContainer extends Component {
    constructor(props) {
      super(props)

      this.state = {
        interimTranscript: '',
        finalTranscript: '',
        recognition: null,
        browserSupportsSpeechRecognition: true
      }
    }

    componentWillMount() {
      if (recognition) {
        recognition.continuous = true
        recognition.interimResults = true
        recognition.onresult = this.updateTranscript.bind(this)
        recognition.start()
        this.setState({ recognition })
      } else {
        this.setState({ browserSupportsSpeechRecognition: false })
      }
    }

    componentWillUnmount() {
      if (this.state.recognition) {
        this.state.recognition.abort()
      }
    }

    updateTranscript(event) {
      const { finalTranscript, interimTranscript } = this.getNewTranscript(
        event
      )

      this.setState({ finalTranscript, interimTranscript })
    }

    getNewTranscript(event) {
      let finalTranscript = this.state.finalTranscript
      let interimTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript = this.concatTranscripts(
            finalTranscript,
            event.results[i][0].transcript
          )
        } else {
          interimTranscript = this.concatTranscripts(
            interimTranscript,
            event.results[i][0].transcript
          )
        }
      }
      return { finalTranscript, interimTranscript }
    }

    concatTranscripts(...transcriptParts) {
      return transcriptParts.map(t => t.trim()).join(' ').trim()
    }

    @autobind
    resetTranscript() {
      this.setState({ interimTranscript: '', finalTranscript: '' })
      if (this.state.recognition) {
        this.state.recognition.abort()
      }
    }

    render() {
      const { finalTranscript, interimTranscript } = this.state
      const transcript = this.concatTranscripts(
        finalTranscript,
        interimTranscript
      )

      return (
        <WrappedComponent
          resetTranscript={this.resetTranscript}
          transcript={transcript}
          {...this.state}
          {...this.props} />
      )
    }
  }
}
