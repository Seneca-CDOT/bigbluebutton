import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Button from '/imports/ui/components/button/component';
import { defineMessages, intlShape, injectIntl } from 'react-intl';
import { styles } from './styles';

const intlMessages = defineMessages({
  confirmLabel: {
    id: 'app.audioModal.yes',
    description: 'Hear yourself yes',
  },
  disconfirmLabel: {
    id: 'app.audioModal.no',
    description: 'Hear yourself no',
  },
  confirmAriaLabel: {
    id: 'app.audioModal.yes.arialabel',
    description: 'provides better context for yes btn label',
  },
  disconfirmAriaLabel: {
    id: 'app.audioModal.no.arialabel',
    description: 'provides better context for no btn label',
  },
});

const propTypes = {
  handleYes: PropTypes.func.isRequired,
  handleNo: PropTypes.func.isRequired,
  intl: intlShape.isRequired,
};

class EchoTest extends Component {
  constructor(props) {
    super(props);
    this.state = {
      disabled: false,
    };
    this.handleYes = props.handleYes.bind(this);
    this.handleNo = props.handleNo.bind(this);
  }

  render() {
    const {
      intl,
    } = this.props;
    const disableYesButtonClicked = callback => () => {
      this.setState({ disabled: true }, callback);
    };
    return (
      <span className={styles.echoTest}>
        <Button
          className={styles.button}
          label={intl.formatMessage(intlMessages.confirmLabel)}
          aria-label={intl.formatMessage(intlMessages.confirmAriaLabel)}
          icon="thumbs_up"
          disabled={this.state.disabled}
          circle
          color="success"
          size="jumbo"
          onClick={disableYesButtonClicked(this.handleYes)}
        />
        <Button
          className={styles.button}
          label={intl.formatMessage(intlMessages.disconfirmLabel)}
          aria-label={intl.formatMessage(intlMessages.disconfirmAriaLabel)}
          icon="thumbs_down"
          circle
          color="danger"
          size="jumbo"
          onClick={this.handleNo}
        />
      </span>
    );
  }
}

export default injectIntl(EchoTest);

EchoTest.propTypes = propTypes;
