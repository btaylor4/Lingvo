import React from 'react';

class SearchBar extends React.Component {
    onTextChange() {
      this.props.onUserInput(this.refs.filterTextInput);
    }
    
    render() {
      return <form>
          <input
            type="text"
            placeholder="Search..."
            ref="filterTextInput"
            onChange={this.onTextChange}
          />
        </form>
    }
  }
  
  class FilteredCards extends React.Component {
    getInitialState() {
      return{
        filteredText: ''
      };
    }
    
    handleUserInput(text) {
      this.setState({
        filterText: text
      })
    }
    
    render() {
      return <div>
        <SearchBar>
          onUserInput ={this.handleUserInput}
        </SearchBar>
        <FriendCards>
          listedUsers={this.props.listedUsers}
        </FriendCards>
      </div>
    }
  }
  
  export default class Search extends React.Component {
    render() {
      return <form>
          <input
            type="text"
            placeholder="Search..."
            onChange={this.onTextChange}
          />
      </form>
    }
    
    onTextChange() {
      setTimeout(function() {
        var list = [];
      
        for(var i = 0; i < users.length; i++) {
          list.push(<Card key={i} name={users[i].username} id={users[i]._id.$oid}></Card>);
        }
      
        const element = <div>{list}</div>;
        ReactDOM.render(element, document.getElementById('cardholder'));
      }, 100);
    }
  }