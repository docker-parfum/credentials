// TODO: We should be able to remove this as part of https://github.com/openedx/credentials/issues/1722
import 'core-js/features/promise'; // Needed to support Promises on legacy browsers
import React from 'react';
import PropTypes from 'prop-types';
import {
  Button, Form, Modal, Alert,
} from '@edx/paragon';
import StringUtils from './Utils';

class SendLearnerRecordModal extends React.Component {
  constructor(props) {
    super(props);
    this.checkCreditPathway = this.checkCreditPathway.bind(this);
    this.getCheckedOrganizations = this.getCheckedOrganizations.bind(this);
    this.callSendHandler = this.callSendHandler.bind(this);
    this.getPathwayDisplayName = this.getPathwayDisplayName.bind(this);
    this.state = {
      creditPathways: this.props.creditPathways,
      numCheckedOrganizations: 0, // Used to decide if we should gray out the 'send' button
    };

    this.anyInactivePathways = this.checkAnyInactivePathways();
  }

  // Get the organizations that are currently checked off
  getCheckedOrganizations() {
    const organizations = [];

    for (let i = 0; i < this.props.creditPathwaysList.length; i += 1) {
      const { name } = this.props.creditPathwaysList[i];
      const pathway = this.state.creditPathways[name];

      if (pathway.checked && !pathway.sent) {
        organizations.push(name);
      }
    }

    return organizations;
  }

  getPathwayDisplayName(name) {
    const pathway = this.state.creditPathways[name];

    if (pathway.sent) {
      return StringUtils.interpolate(gettext('{name} - Sent'), { name });
    }
    if (!pathway.isActive) {
      return StringUtils.interpolate(gettext('{name} - Not Yet Available'), { name });
    }

    return name;
  }

  // Check if there are any organizations that are inactive
  checkAnyInactivePathways() {
    for (let i = 0; i < this.props.creditPathwaysList.length; i += 1) {
      const pathway = this.props.creditPathwaysList[i];
      if (!this.state.creditPathways[pathway.name].isActive) {
        return true;
      }
    }

    return false;
  }

  callSendHandler() {
    this.props.sendHandler(this.getCheckedOrganizations());

    // Close the modal since the send status shows up on the ProgramRecord page
    this.props.onClose();
  }

  // Update a credit pathway's state when the checkbox is updated
  checkCreditPathway(event) {
    const { checked, value: name } = event.target;
    this.setState((prevState) => {
      const updatedCreditPathways = { ...prevState.creditPathways };
      updatedCreditPathways[name].checked = checked;
      return {
        creditPathways: updatedCreditPathways,
        numCheckedOrganizations: prevState.numCheckedOrganizations + (checked ? 1 : -1),
      };
    });
  }

  render() {
    const {
      onClose, parentSelector, typeName, platformName,
    } = this.props;

    return (
      <Modal
        title={StringUtils.interpolate(
          gettext('Send to {platform} Credit Partner'),
          { platform: platformName },
        )}
        {...(parentSelector && { parentSelector })}
        onClose={onClose}
        body={(
          <div>
            <p>{ StringUtils.interpolate(
              gettext('You can directly share your program record with {platform} partners that accept credit for this {type} Program. Once you send your record you cannot unsend it.'),
              {
                platform: platformName,
                type: typeName,
              },
            )}
            </p>
            {this.anyInactivePathways && (
            <div>
              <Alert
                variant="danger"
                show
                dismissible={false}
              >
                <Alert.Heading>
                  { gettext('Not all credit partners are ready to receive records yet')}
                </Alert.Heading>
                <p className="alert-body">{gettext('You can check back in the future or share your record link directly if you need to do so immediately.')}</p>
              </Alert>
            </div>
            )}
            <p>{ gettext('Select organization(s) you wish to send this record to:') }</p>
            <Form.CheckboxSet name="pathways">
              {this.props.creditPathwaysList.map(pathway => (
                <Form.Checkbox
                  id={'checkbox-' + pathway.id}
                  name={pathway.name}
                  value={pathway.name}
                  key={pathway.id}
                  disabled={this.state.creditPathways[pathway.name].sent
                      || !this.state.creditPathways[pathway.name].isActive}
                  onChange={this.checkCreditPathway}
                  checked={this.state.creditPathways[pathway.name].checked}
                >
                  {this.getPathwayDisplayName(pathway.name)}
                </Form.Checkbox>
              ))}
            </Form.CheckboxSet>
          </div>
        )}
        open
        buttons={[
          <Button.Deprecated
            label={gettext('Send')}
            key="send"
            buttonType="primary"
            onClick={this.callSendHandler}
            disabled={this.state.numCheckedOrganizations <= 0}
          />,
        ]}
      />
    );
  }
}

SendLearnerRecordModal.propTypes = {
  onClose: PropTypes.func,
  sendHandler: PropTypes.func.isRequired,
  parentSelector: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.bool,
  ]),
  uuid: PropTypes.string.isRequired,
  typeName: PropTypes.string.isRequired,
  platformName: PropTypes.string.isRequired,
  // TODO: replace with redux global state variables
  // eslint-disable-next-line react/forbid-prop-types
  creditPathways: PropTypes.object,
  // eslint-disable-next-line react/forbid-prop-types
  creditPathwaysList: PropTypes.arrayOf(PropTypes.object),
};

SendLearnerRecordModal.defaultProps = {
  onClose: () => {},
  parentSelector: false,
  creditPathways: {},
  creditPathwaysList: [],
};

export default SendLearnerRecordModal;
