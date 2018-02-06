import * as React from 'react'

import { Dispatcher } from '../../lib/dispatcher'
import { Repository } from '../../models/repository'
import { Branch } from '../../models/branch'
import { Button } from '../lib/button'
import { ButtonGroup } from '../lib/button-group'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Ref } from '../lib/ref'
import { checkBranchExistsOnRemote } from '../../lib/git'

interface IDeleteBranchProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository
  readonly branch: Branch
  readonly onDismissed: () => void
}

interface IDeleteBranchState {
  readonly existsOnRemote: boolean | null
  readonly includeRemoteBranch: boolean
}

export class DeleteBranch extends React.Component<
  IDeleteBranchProps,
  IDeleteBranchState
> {
  public constructor(props: IDeleteBranchProps) {
    super(props)

    this.state = {
      existsOnRemote: null,
      includeRemoteBranch: false,
    }
  }

  public componentWillReceiveProps(nextProps: IDeleteBranchProps) {
    // TODO: re-run this if this.props.branch has changed
    if (this.state.existsOnRemote == null) {
      checkBranchExistsOnRemote(this.props.repository, this.props.branch)
        .then(existsOnRemote => {
          this.setState({ existsOnRemote })
        })
        .catch(err => {
          log.warn(
            `[DeleteBranch] unable to resolve remote branch: ${
              this.props.branch.name
            }`,
            err
          )
          this.setState({ existsOnRemote: false })
        })
    }
  }

  public render() {
    return (
      <Dialog
        id="delete-branch"
        title={__DARWIN__ ? 'Delete Branch' : 'Delete branch'}
        type="warning"
        onDismissed={this.props.onDismissed}
      >
        <DialogContent>
          <p>
            Delete branch <Ref>{this.props.branch.name}</Ref>?
            <br />
            This action cannot be undone.
          </p>

          {this.renderDeleteOnRemote()}
        </DialogContent>
        <DialogFooter>
          <ButtonGroup destructive={true}>
            <Button type="submit">Cancel</Button>
            <Button onClick={this.deleteBranch}>Delete</Button>
          </ButtonGroup>
        </DialogFooter>
      </Dialog>
    )
  }

  private renderDeleteOnRemote() {
    if (this.props.branch.remote && this.state.existsOnRemote == true) {
      return (
        <div>
          <p>
            <strong>
              The branch also exists on the remote, do you wish to delete it
              there as well?
            </strong>
          </p>
          <Checkbox
            label="Yes, delete this branch on the remote"
            value={
              this.state.includeRemoteBranch
                ? CheckboxValue.On
                : CheckboxValue.Off
            }
            onChange={this.onIncludeRemoteChanged}
          />
        </div>
      )
    }

    return null
  }

  private onIncludeRemoteChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.checked

    this.setState({ includeRemoteBranch: value })
  }

  private deleteBranch = () => {
    this.props.dispatcher.deleteBranch(
      this.props.repository,
      this.props.branch,
      this.state.includeRemoteBranch
    )

    return this.props.dispatcher.closePopup()
  }
}
